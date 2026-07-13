cmake_minimum_required(VERSION 3.10)
project(vk_bot)

set(CMAKE_CXX_STANDARD 17)

find_package(CURL REQUIRED)

add_executable(vk_bot main.cpp)
target_link_libraries(vk_bot CURL::libcurl)
