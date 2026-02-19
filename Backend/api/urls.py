from django.urls import path
from .views import counter_decrement, health, counter_get, counter_increment

urlpatterns = [
    path("health/", health),
    path("counter/", counter_get),
    path("counter/increment/", counter_increment),
    path("counter/decrement/", counter_decrement)
]