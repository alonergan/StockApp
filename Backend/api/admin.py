from django.contrib import admin
from .models import (
    Account, Stock, UserAccount,
    AccountStanding, AccountHolding, Trade, StockPrice
)

admin.site.register(Account)
admin.site.register(Stock)
admin.site.register(UserAccount)
admin.site.register(AccountStanding)
admin.site.register(AccountHolding)
admin.site.register(Trade)
admin.site.register(StockPrice)