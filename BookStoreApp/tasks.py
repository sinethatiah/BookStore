from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def ping():
    print("Celery is working!")
    return "pong"


@shared_task
def send_restock_notification(user_email, username, book_title, book_author):
    send_mail(
        subject=f'{book_title} is back in stock!',
        message=f'Good news, {username} — "{book_title}" by {book_author} is now available at Stori Zetu. Come grab your copy before it sells out again!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        fail_silently=True,
    )