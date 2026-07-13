# Здесь будут классы для разных игр
class GuessNumberGame:
    def __init__(self):
        self.number = random.randint(1, 100)
        self.attempts = 0

    def guess(self, num):
        self.attempts += 1
        if num == self.number:
            return f"Угадал за {self.attempts} попыток!"
        return "Мало" if num < self.number else "Много"
