import React, {Component} from 'react';
import {createStore, combineReducers} from 'redux';
import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as SdkMapActions from '@boundlessgeo/sdk/actions/map';
import {Provider} from 'react-redux';
import SdkLayerList from '@boundlessgeo/sdk/components/layer-list';
import SdkLayerListItem from '@boundlessgeo/sdk/components/layer-list-item';
import {DragSource, DropTarget} from 'react-dnd';
import {types, layerListItemSource, layerListItemTarget, collect, collectDrop} from '@boundlessgeo/sdk/components/layer-list-item';

const store = createStore(combineReducers({
  'map': SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

class LayerListItem extends SdkLayerListItem {
  render() {
    const layer = this.props.layer;
    const checkbox = this.getVisibilityControl(layer);

    const moveButtons = (
      <span>
        <button className="sdk-btn" onClick={() => {
          this.moveLayerUp();
        }}>
          { this.props.labels.up }
        </button>
        <button className="sdk-btn" onClick={() => {
          this.moveLayerDown();
        }}>
          { this.props.labels.down }
        </button>
        <button className="sdk-btn" onClick={() => {
          this.removeLayer();
        }}>
          { this.props.labels.remove }
        </button>
      </span>
    );

    return  this.props.connectDragSource(this.props.connectDropTarget((
      <li className="layer">
        <span className="checkbox">{checkbox}</span>
        <span className="name">{layer.id}</span>
        <span className="btn-container">{moveButtons}</span>
      </li>
    )));
  }
}

LayerListItem.defaultProps = {
  labels: {
    up: 'Move up',
    down: 'Move down',
    remove: 'Remove layer',
  },
};

LayerListItem = DropTarget(types, layerListItemTarget, collectDrop)(DragSource(types, layerListItemSource, collect)(LayerListItem));


export default class MAP extends Component {
  componentDidMount() {
  // add the OSM source
    store.dispatch(SdkMapActions.addOsmSource('osm'));

    // add an OSM layer
    store.dispatch(SdkMapActions.addLayer({
      id: 'osm',
      source: 'osm',
    }));
    // Start with a reasonable global view of hte map.
    store.dispatch(SdkMapActions.setView([-90, 38], 2));

    store.dispatch(SdkMapActions.updateMetadata({
      'mapbox:groups': {
        base: {
          name: 'Base Maps',
        },
      },
    }));
    // Background layers change the background color of
    // the map. They are not attached to a source.
    store.dispatch(SdkMapActions.addLayer({
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#eee',
      },
      metadata: {
        'bnd:hide-layerlist': true,
      },
    }));
    store.dispatch(SdkMapActions.addSource('points', {
      type: 'geojson',
      clusterRadius: 50,
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    }));
    // add the wms source
    store.dispatch(SdkMapActions.addSource('states', {
      type: 'raster',
      tileSize: 256,
      tiles: ['https://demo.boundlessgeo.com/geoserver/usa/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
    }));
    // add the wms layer
    store.dispatch(SdkMapActions.addLayer({
      id: 'states',
      source: 'states',
      type: 'raster',
    }));
    store.dispatch(SdkMapActions.addLayer({
      id: 'random-points',
      source: 'points',
      type: 'circle',
      paint: {
        'circle-radius': 3,
        'circle-color': '#756bb1',
        'circle-stroke-color': '#756bb1',
      },
      filter: ['!has', 'point_count'],
    }));
    this.addRandomPoints(200);

  }

  // Add a random point to the map
  addRandomPoints(nPoints = 10) {
    // loop over adding a point to the map.
    for (let i = 0; i < nPoints; i++) {
      // the feature is a normal GeoJSON feature definition,
      // 'points' referes to the SOURCE which will get the feature.
      store.dispatch(SdkMapActions.addFeatures('points', [{
        type: 'Feature',
        properties: {
          title: 'Random Point',
          isRandom: true,
        },
        geometry: {
          type: 'Point',
          // this generates a point somewhere on the planet, unbounded.
          coordinates: [(Math.random() * 360) - 180, (Math.random() * 180) - 90],
        },
      }]));
    }
  }

  render() {
    return (
      <div  className="slideContent">
        <content>
          <div className="left skinny">random-ness</div>
          <div className="right fat">
            <h3>title</h3>
            <Provider store={store}>
              <SdkLayerList layerClass={LayerListItem} />
            </Provider>
            <map>
              <Provider store={store}>
                <SdkMap store={store} />
              </Provider>
            </map>
            <div className="caption">
              caption here
            </div>
          </div>
        </content>
        <footer>
          FOOTER HERE
        </footer>
      </div>
    );
  }
}
