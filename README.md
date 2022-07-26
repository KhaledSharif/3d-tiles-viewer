## Setup

The bulk of the Javascript code required to run is in:

```
./example/mars.js
```

Inside you will find the following line:

groundTiles = new TilesRenderer('octtiles/tileset.json');

This line points to the 3D tiles tileset JSON file at:

```
./example/dev-bundle/octtiles/tileset.json
```

You should replace that file and all accompanying b3dm files in the same folder with your own tileset.

Note that you should execute npm commands from the repository root and not in the example folder.

To run the viewer locally, first install all dependencies:

```
npm install
```

Then run the Javascript compiler:

```
npm run
```

The viewer will be live at:

```
http://127.0.0.1:8080/example/dev-bundle/mars.html
```

