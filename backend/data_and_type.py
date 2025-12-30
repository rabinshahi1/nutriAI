from pydantic import BaseModel ,model_validator,Field,EmailStr,field_validator
from typing import Optional,Annotated



class DailyTargetCreate(BaseModel):
    calories_target: Annotated[int,Field(default=0,gte=0)]
    protein_target:Annotated[int,Field(default=0,gte=0)]

class DailyActivityUpdate(BaseModel):
    calories_consumed: int
    protein_consumed: int


# Request Model (for PUT/POST)
class UserProfileUpdate(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    timezone: Optional[str] = None

# Response Model (for GET)
class UserProfileResponse(BaseModel):
    user_id: str
    username: str
    email: str
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    timezone: Optional[str] = None
    updated_at: Optional[str] = None
    
    
    
class UserSignup(BaseModel):
    username : Annotated[str,Field(...,max_length=30,min_length=3)]
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    @field_validator('email')
    @classmethod
    def email_validate(cls, v: str) -> str:
        allowed_domains = ['gmail.com', 'yahoo.com']
        domain = v.split('@')[-1]
        if domain not in allowed_domains:
            raise ValueError(f'Email domain must be one of: {allowed_domains}')
        return v
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    @field_validator('email')
    @classmethod
    def email_validate(cls, v: str) -> str:
        allowed_domains = ['gmail.com', 'yahoo.com']
        domain = v.split('@')[-1]
        if domain not in allowed_domains:
            raise ValueError(f'Email domain must be one of: {allowed_domains}')
        return v

user_detail={'username':'rabin shahi','age':20,'height':178,'weight':60}


if __name__=='__main__':
    user=UserSignup(**user_detail)
    print(user.bmi)