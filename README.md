# cues

INSTALL AND RUN

1. Make sure you that you have Node.js and Git installed on your computer and that you have an iPhone with an internet connection.
2. Run: npm install --global expo-cli in the terminal.
3. Clone this repository and navigate to the downloaded folder using terminal.
4. Run: expo install
5. Go to the node_modules folder and find the react-native-swiper directory. Inside the index.js file, you'll see two export lines (something like module.exports = ...). Remove both and instead add "export default Swiper;". NOTE - You'll have to do this step every time after you install an npm package. 
7. Run: expo start
8. a window will open up in your browser. Click on "tunnel".
10. Download expo from the App Store on your iPhone and access that link by clicking on it or scanning the QR code using your iPhone camera.
11. Now when you save a change to any of the code files, your expo client will refresh itself if it is open on your screen and you'll see a message.
12. In case it doesn't refresh or you get the message "Disconnected from metro server" - close the expo client and access it again. Make sure the temporary expo link is a "tunnel" and not on "LAN".
