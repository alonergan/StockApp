from django.urls import path, include
from .import views
from rest_framework import routers
from .views import save_ticker

router = routers.DefaultRouter()
router.register(r"ticker", views.TickerView)

urlpatterns =[
    path('', include(router.urls)),
    path('api/submit/', save_ticker),
]