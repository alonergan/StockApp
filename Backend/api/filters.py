import django_filters
from .models import StockPrice, Trade, AccountHolding, AccountStanding

class StockPriceFilter(django_filters.FilterSet):
    # /api/stock-prices/?stock=<id>&start=...&end=...
    start = django_filters.IsoDateTimeFilter(field_name="timeStamp", lookup_expr="gte")
    end = django_filters.IsoDateTimeFilter(field_name="timeStamp", lookup_expr="lte")
    ticker = django_filters.CharFilter(field_name="stock__ticker", lookup_expr="iexact")
    
    class Meta:
        model = StockPrice
        fields = ["stock", "ticker", "start", "end"]

class TradeFilter(django_filters.FilterSet):
    start = django_filters.IsoDateTimeFilter(field_name="timeStamp", lookup_expr="gte")
    end = django_filters.IsoDateTimeFilter(field_name="timeStamp", lookup_expr="lte")

    class Meta:
        model = Trade
        fields = ["stock", "method", "start", "end"]

class HoldingFilter(django_filters.FilterSet):
    class Meta:
        model = AccountHolding
        fields = ["stock", "currentlyHeld"]

class StandingFilter(django_filters.FilterSet):
    start = django_filters.IsoDateTimeFilter(field_name="timeStamp", lookup_expr="gte")
    end = django_filters.IsoDateTimeFilter(field_name="timeStamp", lookup_expr="lte")

    class Meta:
        model = AccountStanding
        fields = ["start", "end"]