from django.db import models
from django.conf import settings

class Account(models.Model):
    startBalance = models.DecimalField(decimal_places=2, max_digits=12)
    balance = models.DecimalField(decimal_places=2, max_digits=12)
    riskLevel = models.IntegerField()
    thresholdPercentage = models.DecimalField(decimal_places=2, max_digits=12)

    def __str__(self):
        return f"{self.id}"

class Stock(models.Model):
    ticker = models.CharField(max_length=255)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"Ticker: {self.ticker}, Name: {self.name}"

class UserAccount(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_account")
    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='user_account')

    def __str__(self):
        return f"{self.user.username} - Account: {self.account}"


class AccountStanding(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    balance = models.DecimalField(decimal_places=2, max_digits=12)
    timeStamp = models.DateTimeField()

    def __str__(self):
        return f"[{self.timeStamp}] - Account: {self.account}, Balance: {self.balance}"

class AccountHolding(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    currentlyHeld = models.BooleanField()

    def __str__(self):
        return f"Account: {self.account}, Stock: {self.stock}, Held: {self.currentlyHeld}"

class Trade(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    timeStamp = models.DateTimeField()
    price = models.DecimalField(decimal_places=2, max_digits=12)
    method = models.CharField(max_length=255)

    def __str__(self):
        return f"[{self.timeStamp}] - Account {self.account} {self.method} {self.stock} for {self.price}"

class StockPrice(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    price = models.DecimalField(decimal_places=2, max_digits=12)
    timeStamp = models.DateTimeField()

    def __str__(self):
        return f"[{self.timeStamp}] - Stock: {self.stock}, Price: {self.price}"