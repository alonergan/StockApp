from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, StockViewSet, AccountStandingViewSet,
    AccountHoldingViewSet, TradeViewSet, StockPriceViewSet, UserAccountViewSet,
    register, me
)

router = DefaultRouter()
router.register(r"accounts", AccountViewSet, basename = 'accounts')
router.register(r"stocks", StockViewSet, basename = 'stocks')
router.register(r"users", UserAccountViewSet, basename = 'userAccounts')
router.register(r"account-standings", AccountStandingViewSet, basename = 'accountStandings')
router.register(r"account-holdings", AccountHoldingViewSet, basename = 'accountHoldings')
router.register(r"trades", TradeViewSet, basename = 'trades')
router.register(r"stock-prices", StockPriceViewSet, basename = 'stockPrices')

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", register),
    path("auth/me/", me)
]