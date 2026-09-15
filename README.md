# Photo Booth

An interactive online photo booth with camera capture, selectable frames and filters, animated booth transitions, printed-photo delivery, and an album.

## Run locally

Open `index.html` in a browser, or serve the folder with any static web server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

Camera access works on `localhost` or a secure HTTPS site. The browser will ask for camera permission when the booth opens.

## GitHub Pages

Upload the contents of this folder to a GitHub repository. In **Settings → Pages**, choose:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/ (root)`

The app is static and does not require a build step. `index.html` is the entry page. The `dist` folder contains a synchronized static copy and is not required for the root deployment.

## Included features

- Responsive desktop and mobile layout
- Camera preview sized to match the selected frame ratio
- Multiple photo frames and filters
- Review, finish, pickup, delivery, and album flow
- PWA manifest and service worker for installable mobile use
