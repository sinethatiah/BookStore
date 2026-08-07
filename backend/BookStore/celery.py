import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BookStore.settings')

app = Celery('BookStore')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()