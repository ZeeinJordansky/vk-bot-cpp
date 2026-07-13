#include <iostream>
#include <string>
#include <curl/curl.h>
#include <nlohmann/json.hpp>
#include <thread>
#include <chrono>

using json = nlohmann::json;

// Замените на свои
std::string ACCESS_TOKEN = "YOUR_TOKEN_HERE";
int GROUP_ID = 123456789; // ID вашего сообщества

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

json callVKMethod(const std::string& method, const std::string& params) {
    CURL* curl = curl_easy_init();
    std::string readBuffer;

    std::string url = "https://api.vk.com/method/" + method + "?access_token=" + ACCESS_TOKEN + "&v=5.199&" + params;

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        std::cerr << "CURL error: " << curl_easy_strerror(res) << std::endl;
        return {};
    }

    try {
        return json::parse(readBuffer);
    } catch (...) {
        return {};
    }
}

int main() {
    std::cout << "VK Bot starting..." << std::endl;

    // Получаем Long Poll сервер
    json lpServer = callVKMethod("groups.getLongPollServer", "group_id=" + std::to_string(GROUP_ID));

    if (lpServer.contains("error")) {
        std::cerr << "Error getting Long Poll server: " << lpServer.dump() << std::endl;
        return 1;
    }

    std::string key = lpServer["response"]["key"];
    std::string server = lpServer["response"]["server"];
    std::string ts = lpServer["response"]["ts"];

    while (true) {
        std::string lpUrl = server + "?act=a_check&key=" + key + "&ts=" + ts + "&wait=25&mode=2&version=3";

        CURL* curl = curl_easy_init();
        std::string response;

        curl_easy_setopt(curl, CURLOPT_URL, lpUrl.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        CURLcode res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);

        if (res == CURLE_OK) {
            try {
                json data = json::parse(response);
                if (data.contains("ts")) {
                    ts = data["ts"];
                }
                if (data.contains("updates")) {
                    for (auto& update : data["updates"]) {
                        if (update[0] == 4) { // new message
                            int msgId = update[1];
                            std::string text = update[5]["text"];
                            int peerId = update[3];

                            std::cout << "New message from " << peerId << ": " << text << std::endl;

                            // Echo reply
                            callVKMethod("messages.send", "peer_id=" + std::to_string(peerId) + "&message=Эхо: " + text + "&random_id=" + std::to_string(time(nullptr)));
                        }
                    }
                }
            } catch (...) {
                std::cerr << "JSON parse error" << std::endl;
            }
        }

        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    return 0;
}
