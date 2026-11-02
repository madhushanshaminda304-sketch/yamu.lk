import React from 'react';
import { MapLibreRouteMap, type MapLibreRouteMapProps } from './MapLibreRouteMap.tsx';

export type LeafletRouteMapProps = MapLibreRouteMapProps;

/**
 * LeafletRouteMap - Seamless backward-compatible adapter.
 * Replaces legacy CARTO raster tiles with high-performance MapLibre GL JS vector tiles
 * powered by OpenFreeMap Liberty style.
 */
export function LeafletRouteMap(props: LeafletRouteMapProps) {
  return <MapLibreRouteMap {...props} />;
}

export default LeafletRouteMap;
