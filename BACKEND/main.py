from fastapi import FastAPI, HTTPException
from prophet import Prophet
import pandas as pd
from pymongo import MongoClient
import datetime
import os
from contextlib import asynccontextmanager

# --- GLOBAL MEMORY ---
ml_memory = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🧠 BRAIN: Training model and mapping 2026...")
    DATA_PATH = r'C:\Users\Madaa\ETHUSD_1h_Combined_Index.csv'
    
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        df = df.rename(columns={'Open time': 'ds', 'Close': 'y'})
        df['ds'] = pd.to_datetime(df['ds']).dt.tz_localize(None)
        df['ds'] = df['ds'] + pd.DateOffset(years=1) 

        model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=True)
        model.fit(df)
        
        future = model.make_future_dataframe(periods=8760, freq='h')
        forecast = model.predict(future)
        
        # We ensure the forecast dates are clean datetimes
        forecast['ds'] = pd.to_datetime(forecast['ds'])
        ml_memory["forecast"] = forecast
        print("✅ BRAIN: 2026 Map Ready!")
    yield
    ml_memory.clear()

app = FastAPI(lifespan=lifespan)

# --- MONGODB ---
MONGO_URI = "mongodb+srv://madaa:manya2myra@cluster0.btlvyu5.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client['smart_wallet_db']
transactions_collection = db['scheduled_transactions']

def serialize_doc(doc):
    if not doc: return None
    doc["id"] = str(doc.pop("_id"))
    if "created_at" in doc and isinstance(doc["created_at"], datetime.datetime):
        doc["created_at"] = doc["created_at"].strftime('%Y-%m-%d %H:%M:%S')
    return doc

@app.post("/predict_and_schedule")
def predict_and_schedule(
    amount: float, 
    token: str, 
    start_time: str = None, 
    end_time: str = None
):
    try:
        forecast = ml_memory.get("forecast")
        if forecast is None:
            raise HTTPException(status_code=500, detail="Brain not loaded. Wait for the green 'Ready' message.")

        # --- SMART FILTERING ---
        if start_time and end_time:
            # Clean and convert strings to dates
            s_dt = pd.to_datetime(start_time.replace("+", " ")).replace(tzinfo=None)
            e_dt = pd.to_datetime(end_time.replace("+", " ")).replace(tzinfo=None)
            
            # Search for the best time in that window
            mask = (forecast['ds'] >= s_dt) & (forecast['ds'] <= e_dt)
            range_data = forecast.loc[mask]
            
            # If the weekend isn't in our data, fall back to the next 7 days
            if range_data.empty:
                print("⚠️ Window empty, searching next 7 days instead...")
                now = datetime.datetime.now()
                next_week = now + datetime.timedelta(days=7)
                mask = (forecast['ds'] >= now) & (forecast['ds'] <= next_week)
                range_data = forecast.loc[mask]
        else:
            range_data = forecast

        if range_data.empty:
            raise HTTPException(status_code=400, detail="No price data available for the requested time.")

        # Find the best row
        best_row = range_data.loc[range_data['yhat'].idxmin()]
        
        clean_time = best_row['ds'].strftime('%Y-%m-%d %H:%M:%S')
        predicted_price = float(best_row['yhat'])

        tx_record = {
            "user_id": "Madaa_User",
            "amount": float(amount),
            "token": str(token),
            "scheduled_time": clean_time,
            "predicted_price": predicted_price,
            "status": "queued",
            "created_at": datetime.datetime.now()
        }

        result = transactions_collection.insert_one(tx_record)

        return {
            "message": "Success! Transaction scheduled.",
            "db_id": str(result.inserted_id),
            "best_time": clean_time,
            "predicted_price": round(predicted_price, 2)
        }
        
    except Exception as e:
        print(f"❌ SERVER ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")
    



