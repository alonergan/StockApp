from django.shortcuts import render

# Create your views here.

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from .models import Counter
from .serializers import CounterSerializer

@api_view(['GET'])
def health(request):
    return Response({"status": "ok"})

def get_single_counter():
    obj = Counter.objects.first()
    if obj is None:
        obj = Counter.objects.create(value = 0)
    return obj

@api_view(['GET'])
def counter_get(request):
    obj = get_single_counter()
    return Response(CounterSerializer(obj).data)

@api_view(['POST'])
@transaction.atomic
def counter_increment(request):
    obj = get_single_counter()
    obj.value += 1
    obj.save()
    return Response(CounterSerializer(obj).data, status=status.HTTP_200_OK)

@api_view(['POST'])
@transaction.atomic
def counter_decrement(request):
    obj = get_single_counter()
    obj.value -= 1
    obj.save()
    return Response(CounterSerializer(obj).data, status=status.HTTP_200_OK)