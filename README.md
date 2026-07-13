# VK Bot на C++

Простой VK бот с использованием Bots Long Poll API.

## Сборка

```bash
mkdir build && cd build
cmake ..
make
```

## Настройка

1. Создайте сообщество в VK.
2. Получите access token с правами messages.
3. Укажите group_id и token в main.cpp.

## Запуск

```bash
./vk-bot
```