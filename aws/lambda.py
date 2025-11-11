import json
import boto3
import uuid

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
polly = boto3.client("polly", region_name="us-east-1")
s3 = boto3.client("s3")

BUCKET = """
CLOUDFRONT_DOMAIN = ""

SYSTEM_PROMPT = """
Eres Kai Mori, entrenador frío estilo Blue Lock.
Tu estilo:
- Cortante, preciso, directo.
- No motivas ni consuelas.
- Revelas debilidades sin suavizar.
- Siempre respondes en máximo 2 frases.
- Nunca uses emojis ni tono amigable.
Responde en español.
"""

def extract_input(event):
    if "body" in event:
        return json.loads(event["body"]).get("input", "").strip()
    return event.get("input", "").strip()

def lambda_handler(event, context):
    user_text = extract_input(event)

    # ✅ Llama 3 usa PROMPT plano, no "messages"
    prompt = f"{SYSTEM_PROMPT}\nUsuario: {user_text}\nKai Mori:"

    payload = {
        "prompt": prompt,
        "max_gen_len": 120,
        "temperature": 0.4,
        "top_p": 0.9
    }

    response = bedrock.invoke_model(
        modelId="meta.llama3-70b-instruct-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload)
    )

    result = json.loads(response["body"].read())
    npc_text = result["generation"].strip()

    # Convertir texto a voz
    polly_res = polly.synthesize_speech(
        Text=npc_text,
        OutputFormat="mp3",
        VoiceId="Lupe"
    )
    audio_bytes = polly_res["AudioStream"].read()

    file_key = f"voices/{uuid.uuid4()}.mp3"
    s3.put_object(
        Bucket=BUCKET,
        Key=file_key,
        Body=audio_bytes,
        ContentType="audio/mpeg"
    )

    audio_url = f"https://{CLOUDFRONT_DOMAIN}/{file_key}"

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "text": npc_text,
            "audio_url": audio_url
        })
    }
