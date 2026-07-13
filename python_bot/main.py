import os
import random
from dotenv import load_dotenv
from vk_bottle import Bottle, run, Message

load_dotenv()

TOKEN = os.getenv('VK_TOKEN')
GROUP_ID = int(os.getenv('GROUP_ID'))

app = Bottle(token=TOKEN, group_id=GROUP_ID)

games = {}  # peer_id: game_state

@app.on.message(text=['начать', 'старт', 'привет'])
def start(message: Message):
    return "Привет! Я игровой бот ВК. Напиши 'игра' чтобы начать.",

@app.on.message(text='игра')
def start_game(message: Message):
    peer_id = message.peer_id
    number = random.randint(1, 100)
    games[peer_id] = {'number': number, 'attempts': 0}
    return f"Игра 'Угадай число' начата! Я загадал число от 1 до 100. Пиши свой вариант.",

@app.on.message()
def handle_game(message: Message):
    peer_id = message.peer_id
    text = message.text.strip().lower()

    if peer_id not in games:
        if text in ['помощь', 'команды']:
            return "Команды: начать, игра, стоп, помощь"
        return None

    if text == 'стоп':
        del games[peer_id]
        return "Игра остановлена."

    try:
        guess = int(text)
        game = games[peer_id]
        game['attempts'] += 1

        if guess == game['number']:
            attempts = game['attempts']
            del games[peer_id]
            return f"Поздравляю! Ты угадал число {guess} за {attempts} попыток! 🎉\nНапиши 'игра' для новой партии."
        elif guess < game['number']:
            return f"Мало! Попробуй больше. Попыток: {game['attempts']}"
        else:
            return f"Много! Попробуй меньше. Попыток: {game['attempts']}"
    except ValueError:
        return "Введи число!"

if __name__ == '__main__':
    print("Бот запущен...")
    run(app, host='0.0.0.0', port=8080)
