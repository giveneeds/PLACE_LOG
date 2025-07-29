import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_activation_email(email: str, token: str):
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning("Email settings not configured. Skipping email send.")
        logger.info(f"Activation link: {settings.FRONTEND_URL}/auth/activate?token={token}")
        return
    
    activation_url = f"{settings.FRONTEND_URL}/auth/activate?token={token}"
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "Place Log Pro - 계정 활성화"
    message["From"] = settings.FROM_EMAIL
    message["To"] = email
    
    html = f"""
    <html>
      <body>
        <h2>Place Log Pro에 오신 것을 환영합니다!</h2>
        <p>계정을 활성화하려면 아래 링크를 클릭해주세요:</p>
        <p><a href="{activation_url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">계정 활성화</a></p>
        <p>또는 아래 링크를 브라우저에 직접 복사하여 붙여넣으세요:</p>
        <p>{activation_url}</p>
        <p>이 링크는 24시간 동안 유효합니다.</p>
        <br>
        <p>감사합니다,<br>Place Log Pro 팀</p>
      </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    message.attach(part)
    
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        logger.info(f"Activation email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send activation email: {str(e)}")
        raise