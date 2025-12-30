from transformers import ViTForImageClassification,ViTImageProcessor 
from PIL import Image
import io
MODEL_PATH='model'

processor=ViTImageProcessor.from_pretrained(MODEL_PATH)
model=ViTForImageClassification.from_pretrained(MODEL_PATH)
id2label=model.config.id2label
def predict_food_vit(img_bytes: bytes):
    try:
        image=Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image: {e}")
    inputs=processor(images=image,return_tensors='pt')
    output=model(**inputs)
    logits=output.logits
    probs=logits.softmax(dim=1)
    pred=logits.argmax(dim=1).item()
    pred_class_name=id2label[pred]
    pred_probability=round(probs[0][pred].item()*100,3)
    return {
        'class_name':pred_class_name,
        'probability':pred_probability
    }
    
    
    
    
    

