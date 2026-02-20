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
    accountID = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='user_account')

    def __str__(self):
        return f"{self.user.username} - Account: {self.accountID}"


class AccountStanding(models.Model):
    accountID = models.ForeignKey(Account, on_delete=models.CASCADE)
    balance = models.DecimalField(decimal_places=2, max_digits=12)
    timeStamp = models.DateTimeField()

    def __str__(self):
        return f"[{self.timeStamp}] - Account: {self.accountID}, Balance: {self.balance}"

class AccountHolding(models.Model):
    accountID = models.ForeignKey(Account, on_delete=models.CASCADE)
    stockID = models.ForeignKey(Stock, on_delete=models.CASCADE)
    currentlyHeld = models.BooleanField()

    def __str__(self):
        return f"Account: {self.accountID}, Stock: {self.stockID}, Held: {self.currentlyHeld}"

class Trade(models.Model):
    accountID = models.ForeignKey(Account, on_delete=models.CASCADE)
    stockID = models.ForeignKey(Stock, on_delete=models.CASCADE)
    timeStamp = models.DateTimeField()
    price = models.DecimalField(decimal_places=2, max_digits=12)
    method = models.CharField(max_length=255)

    def __str__(self):
        return f"[{self.timeStamp}] - Account {self.accountID} {self.method} {self.stockID} for {self.price}"

class StockPrice(models.Model):
    stockID = models.ForeignKey(Stock, on_delete=models.CASCADE)
    price = models.DecimalField(decimal_places=2, max_digits=12)
    timeStamp = models.DateTimeField()

    def __str__(self):
        return f"[{self.timeStamp}] - Stock: {self.stockID}, Price: {self.price}"