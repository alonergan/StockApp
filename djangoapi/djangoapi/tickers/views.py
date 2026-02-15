from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.shortcuts import get_object_or_404
from .models import Ticker
from .serializers import TickerSerializer


# THIS WAS MISSING — it MUST exist for your router
class TickerView(viewsets.ModelViewSet):
    queryset = Ticker.objects.all()
    serializer_class = TickerSerializer
    lookup_field = "ticker"
    lookup_value_regex = "[A-Za-z0-9._-]+"


@api_view(['GET','POST','PUT','PATCH','DELETE'])
def save_ticker(request):

    # CREATE
    if request.method == 'POST':
        serializer = TickerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    # READ ALL
    if request.method == 'GET':
        tickers = Ticker.objects.all()
        serializer = TickerSerializer(tickers, many=True)
        return Response(serializer.data, status=200)

    # UPDATE
    if request.method in ['PUT', 'PATCH']:
        ticker_value = request.data.get("ticker")
        ticker_obj = get_object_or_404(Ticker, ticker=ticker_value)

        serializer = TickerSerializer(
            ticker_obj,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

    # DELETE
    if request.method == 'DELETE':
        ticker_value = request.data.get("ticker")
        ticker_obj = get_object_or_404(Ticker, ticker=ticker_value)
        ticker_obj.delete()
        return Response({"msg": "Deleted"}, status=204)