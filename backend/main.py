from fastapi import FastAPI, UploadFile, File, HTTPException,status
from fastapi.middleware.cors import CORSMiddleware
import io
from db import get_db_connection

from fastapi.encoders import jsonable_encoder
import bcrypt
from data_and_type import UserSignup ,UserLogin,UserProfileResponse,UserProfileUpdate,DailyActivityUpdate,DailyTargetCreate
from psycopg2.extras import RealDictCursor
from datetime import date
from model_setup import predict_food_vit
app = FastAPI(title="Food Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# GET - Fetch active daily target for a user
@app.get("/daily-targets/{user_id}")
async def get_daily_target(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        query = """
            SELECT id, user_id, calories_target, protein_target, active, created_at
            FROM daily_targets
            WHERE user_id = %s AND active = TRUE
            ORDER BY created_at DESC
            LIMIT 1;
        """
        cur.execute(query, (user_id,))
        target = cur.fetchone()
        
        if not target:
            return {
                "status": "success",
                "target": None,
                "message": "No active target found"
            }
        
        return {
            "status": "success",
            "target": {
                "id": str(target['id']),
                "user_id": str(target['user_id']),
                "calories_target": target['calories_target'],
                "protein_target": target['protein_target'],
                "active": target['active'],
                "created_at": target['created_at'].isoformat()
            }
        }
    
    except Exception as e:
        print(f"Error fetching target: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# POST - Create or update daily target
@app.post("/daily-targets/{user_id}")
async def create_daily_target(user_id: str, target_data: DailyTargetCreate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Deactivate all previous targets
        cur.execute(
            "UPDATE daily_targets SET active = FALSE WHERE user_id = %s",
            (user_id,)
        )
        
        # Insert new target
        query = """
            INSERT INTO daily_targets (user_id, calories_target, protein_target, active)
            VALUES (%s, %s, %s, TRUE)
            RETURNING id, user_id, calories_target, protein_target, active, created_at;
        """
        cur.execute(query, (
            user_id,
            target_data.calories_target,
            target_data.protein_target
        ))
        
        new_target = cur.fetchone()
        conn.commit()
        
        return {
            "status": "success",
            "target": {
                "id": str(new_target['id']),
                "user_id": str(new_target['user_id']),
                "calories_target": new_target['calories_target'],
                "protein_target": new_target['protein_target'],
                "active": new_target['active'],
                "created_at": new_target['created_at'].isoformat()
            }
        }
    
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error creating target: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# GET - Fetch today's activity for a user
@app.get("/daily-activity/{user_id}/today")
async def get_today_activity(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        today = date.today()
        
        query = """
            SELECT id, user_id, activity_date, calories_consumed, protein_consumed, completed, created_at
            FROM daily_activity
            WHERE user_id = %s AND activity_date = %s;
        """
        cur.execute(query, (user_id, today))
        activity = cur.fetchone()
        
        if not activity:
            # Create today's activity with zero values
            insert_query = """
                INSERT INTO daily_activity (user_id, activity_date, calories_consumed, protein_consumed)
                VALUES (%s, %s, 0, 0)
                RETURNING id, user_id, activity_date, calories_consumed, protein_consumed, completed, created_at;
            """
            cur.execute(insert_query, (user_id, today))
            activity = cur.fetchone()
            conn.commit()
        
        return {
            "status": "success",
            "activity": {
                "id": str(activity['id']),
                "user_id": str(activity['user_id']),
                "activity_date": activity['activity_date'].isoformat(),
                "calories_consumed": activity['calories_consumed'],
                "protein_consumed": activity['protein_consumed'],
                "completed": activity['completed'],
                "created_at": activity['created_at'].isoformat()
            }
        }
    
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error fetching activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# PUT - Update today's activity
@app.put("/daily-activity/{user_id}/today")
async def update_today_activity(user_id: str, activity_data: DailyActivityUpdate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        today = date.today()
        
        query = """
            INSERT INTO daily_activity (user_id, activity_date, calories_consumed, protein_consumed)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, activity_date)
            DO UPDATE SET
                calories_consumed = EXCLUDED.calories_consumed,
                protein_consumed = EXCLUDED.protein_consumed
            RETURNING id, user_id, activity_date, calories_consumed, protein_consumed, completed, created_at;
        """
        cur.execute(query, (
            user_id,
            today,
            activity_data.calories_consumed,
            activity_data.protein_consumed
        ))
        
        updated_activity = cur.fetchone()
        conn.commit()
        
        return {
            "status": "success",
            "activity": {
                "id": str(updated_activity['id']),
                "user_id": str(updated_activity['user_id']),
                "activity_date": updated_activity['activity_date'].isoformat(),
                "calories_consumed": updated_activity['calories_consumed'],
                "protein_consumed": updated_activity['protein_consumed'],
                "completed": updated_activity['completed'],
                "created_at": updated_activity['created_at'].isoformat()
            }
        }
    
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()





@app.get("/user/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        query = """
            SELECT 
                u.id as user_id,
                u.username,
                u.email,
                up.height_cm,
                up.weight_kg,
                up.age,
                up.gender,
                up.timezone,
                up.updated_at
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = %s;
        """
        cur.execute(query, (user_id,))
        user_data = cur.fetchone()
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return dict directly - Pydantic validates it
        return UserProfileResponse(
            user_id=str(user_data['user_id']),
            username=user_data['username'],
            email=user_data['email'],
            height_cm=float(user_data['height_cm']) if user_data['height_cm'] else None,
            weight_kg=float(user_data['weight_kg']) if user_data['weight_kg'] else None,
            age=user_data['age'],
            gender=user_data['gender'],
            timezone=user_data['timezone'],
            updated_at=user_data['updated_at'].isoformat() if user_data['updated_at'] else None
        )
    
    finally:
        cur.close()
        conn.close()

# PUT endpoint - Pydantic validates request body
@app.put("/user/profile/{user_id}")
async def update_user_profile(user_id: str, profile_data: UserProfileUpdate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        query = """
            INSERT INTO user_profiles (user_id, height_cm, weight_kg, age, gender, timezone)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                height_cm = EXCLUDED.height_cm,
                weight_kg = EXCLUDED.weight_kg,
                age = EXCLUDED.age,
                gender = EXCLUDED.gender,
                timezone = EXCLUDED.timezone,
                updated_at = NOW()
            RETURNING *;
        """
        cur.execute(query, (
            user_id,
            profile_data.height_cm,
            profile_data.weight_kg,
            profile_data.age,
            profile_data.gender,
            profile_data.timezone
        ))
        
        updated_profile = cur.fetchone()
        conn.commit()
        
        return {"status": "success", "profile": updated_profile}
    
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )
    finally:
        cur.close()
        conn.close()


@app.post("/auth/login")
async def login(user_credentials: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Fetch the user
        cur.execute(
            "SELECT id, username, email, password_hash FROM users WHERE email = %s",
            (user_credentials.email,)
        )
        user_record = cur.fetchone()

        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Email or Password"
            )

        # 2. Access dictionary values correctly
        db_id = user_record['id']
        db_username = user_record['username']
        db_email = user_record['email']
        db_password_hash = user_record['password_hash']

        # 3. Prepare bytes for bcrypt
        user_pw_bytes = user_credentials.password.encode('utf-8')
        
        # stored_hash -> bytes (Bcrypt hashes must start with $2b$ or $2a$)
        try:
            hash_bytes = db_password_hash.encode('utf-8')
            
            # 4. The Comparison
            if bcrypt.checkpw(user_pw_bytes, hash_bytes):
                return {
                    "status": "success",
                    "user": {
                        "id": str(db_id),
                        "username": db_username,
                        "email": db_email
                    }
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Email or Password"
                )
        except ValueError as e:
            # This catches the "Invalid Salt" error specifically
            print(f"Bcrypt error: {e}. The hash in DB is likely corrupted or old.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed: Account security format mismatch. Please sign up again."
            )

    finally:
        cur.close()
        conn.close()

@app.post("/auth/signup")
async def signup(user: UserSignup):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Existence Check
        cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (user.email, user.username))
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or Email already registered"
            )

        # 2. Hashing
        password_bytes = user.password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        hashed_password = bcrypt.hashpw(password_bytes, salt)
        db_password_hash = hashed_password.decode('utf-8')

        # 3. Insert with precise RETURNING
        query = """
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, username, email, created_at;
        """
        cur.execute(query, (user.username, user.email, db_password_hash))
        
        # 4. Fetch the result
        new_user = cur.fetchone()
        
        if not new_user:
            # If for some reason the DB didn't return the row
            raise Exception("Database failed to return the new user record.")

        conn.commit()

        # 5. Safe Response construction
        # Mapping by index: 0=id, 1=username, 2=email, 3=created_at
        return {
      "status": "success",
       "user": {
        "id": str(new_user['id']),
        "username": str(new_user['username']),
        "email": str(new_user['email']),
        "created_at": new_user['created_at'].isoformat() if hasattr(new_user['created_at'], 'isoformat') else str(new_user['created_at'])
    }
}

    except HTTPException as he:
        raise he
    except Exception as e:
        if conn:
            conn.rollback()
        # This will now print the full error description instead of just '0'
        import traceback
        print(f"DEBUG ERROR: {traceback.format_exc()}") 
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )
    finally:
        cur.close()
        conn.close()

@app.post("/predict")
async def predict_food_api(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
       
       

        try:
         result = predict_food(image_bytes)
         food_name=result['class_name']
         confidence=result['probability']
        
        except Exception as e:
         print("Error in model prediction:", e)
         raise HTTPException(status_code=500, detail="Model prediction failed")
     
        conn = get_db_connection()
        
        print(f"connection established!")
        cur = conn.cursor()
       
        cur.execute(
            """
            SELECT
                name,
                calories_kcal,
                protein_g,
                fat_g,
                carbs_g,
                vitamins,
                minerals
            FROM food_items
            WHERE name = %s
            """,
            (food_name.lower(),)
        )
        try:
            

         food_data = cur.fetchone()
        except:
            raise Exception("opps the data at fetchiing we got error")
        cur.close()
        conn.close()

        if not food_data:
            raise HTTPException(status_code=404, detail="Food not found")

        return {
            "food": food_name,
            "confidence": confidence,
            "nutrition": jsonable_encoder(food_data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



