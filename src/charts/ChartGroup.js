(function(insight) {

    /**
     * The ChartGroup class is a container for Charts and Tables, linking them together
     * and coordinating cross chart filtering and styling.
     * @class insight.ChartGroup
     */
    insight.ChartGroup = function ChartGroup() {

        this.charts = [];
        this.tables = [];
        this.groupings = [];
        this.dimensions = [];
        this.filteredDimensions = [];
        this.dimensionListenerMap = {};

        // private variables
        var self = this;

        // private methods

        /*
         * This internal function responds to click events on Series and Tables,
         * alerting any other elements using the same Dimension that they need to
         * update to highlight the selected slices of the Dimension
         */
        var notifyListeners = function(dimensionName, dimensionSelector) {
            var listeningObjects = self.dimensionListenerMap[dimensionName];

            if (listeningObjects != null) {

                listeningObjects.forEach(function(item) {
                    item.highlight(dimensionSelector);
                });

            }
        };

        /*
         * This function takes a list of series and binds the click events of each one to the ChartGroup
         * filtering handler. It also adds the series' dataset to the internal list.
         */
        var addSeries = function(chart) {
            chart.series()
                .forEach(function(series) {

                    addDimensionListener(series.data, chart);

                    series.clickEvent = self.chartFilterHandler;

                    addDataSet(series.data);
                });
        };

        /* 
         * This function is called when a Chart belonging to this ChartGroup updates its list of Series.
         * The ChartGroup needs to register the click events and any crossfilter dimensions belonging to
         * the Series.
         */
        var newSeries = function(chart, series) {

            addSeries(chart, series);
        };


        /* 
         * This function checks if the provided DataSet is crossfilter enabled,
         * and if so, adds its components to internal lists of Groupings and Dimensions.
         */
        var addDataSet = function(dataset) {

            // If this is a crossfilter enabled DataSet (aggregated and filter enabled)
            var crossfilterEnabled = dataset.dimension;

            if (crossfilterEnabled) {

                // Add Grouping and Dimension to internal lists if they are not already there             
                insight.Utils.addToSet(self.groupings, dataset);
                insight.Utils.addToSet(self.dimensions, dataset.dimension);
            }
        };

        /*
         * Adds a Table to this ChartGroup, wiring up the Table's events to any
         * related Charts or Tables in the ChartGroup.
         * @memberof! insight.ChartGroup
         * @instance
         */
        var addTable = function(table) {

            // wire up the click event of the table to the filter handler of the DataSet
            table.clickEvent = self.chartFilterHandler;

            addDimensionListener(table.data, table);

            self.tables.push(table);

            return table;
        };


        /*
         * Adds a Chart to this ChartGroup, wiring up the click events of each Series to the filter handler
         * @memberof! insight.ChartGroup
         * @instance
         */
        var addChart = function(chart) {

            chart.seriesChanged = newSeries;

            addSeries(chart);

            self.charts.push(chart);

            return chart;
        };


        /*
         * Given a DataSet and a widget (Table or Chart), this function adds the widget
         * to the map of items subscribed to events on that Dimension,
         * only if the provided DataSet is a crossfilter enabled one that exposes a dimension property.
         */
        var addDimensionListener = function(dataset, widget) {
            var dimension = dataset ? dataset.dimension : null;

            if (dimension) {
                var listeningObjects = self.dimensionListenerMap[dimension.name];

                if (listeningObjects) {

                    var alreadyListening = insight.Utils.arrayContains(listeningObjects, widget);

                    if (!alreadyListening) {
                        self.dimensionListenerMap[dimension.name].push(widget);
                    }
                } else {
                    self.dimensionListenerMap[dimension.name] = [widget];
                }
            }
        };

        // public methods


        /**
         * Adds an item to this ChartGroup, calling the appropriate internal addChart or addTable function
         * depending on the type.
         * @memberof! insight.ChartGroup
         * @instance
         * @param {object} widget - An insight.Table or insight.Chart
         * @returns {this}
         */
        this.add = function(widget) {
            if (widget instanceof insight.Chart) {
                addChart(widget);
            } else if (widget instanceof insight.Table) {
                addTable(widget);
            }
            return self;
        };

        /**
         * Draws all Charts and Tables in this ChartGroup
         * @memberof! insight.ChartGroup
         * @instance
         */
        this.draw = function() {

            self.charts.forEach(function(chart) {
                chart.draw();
            });

            self.tables.forEach(function(table) {
                table.draw();
            });
        };

        /**
         * Method handler that is bound by the ChartGroup to the click events of any chart series or table rows,
         * if the DataSets used by those entities are crossfilter enabled.
         * It notifies any other listening charts of the dimensional selection event, which they can respond to
         * by applying CSS highlighting etc.
         * @memberof! insight.ChartGroup
         * @instance
         * @param {object} dataset - The insight.DataSet or insight.Grouping being filtered
         * @param {string} value - The value that the dimension is being sliced/filtered by.
         */
        this.chartFilterHandler = function(dataset, value) {

            var dimensionSelector = insight.Utils.keySelector(value);

            // send events to any charts or tables also using this dimension, as they will need to update their
            // styles to reflect the selection
            notifyListeners(dataset.dimension.name, dimensionSelector);

            var dimension = dataset.dimension;

            var filterFunc = dimension.createFilterFunction(value);
            var nameProperty = 'name';

            // get the list of any dimensions matching the one that is being filtered
            var dims = insight.Utils.takeWhere(self.dimensions, nameProperty, dimension.name);

            // get the list of matching dimensions that are already filtered
            var activeDim = insight.Utils.takeWhere(self.filteredDimensions, nameProperty, dimension.name);

            // add the new filter to the list of active filters if it's not already active
            if (!activeDim.length) {
                self.filteredDimensions.push(dimension);
            }

            // loop through the matching dimensions to filter them all
            dims.map(function(dim) {

                var filterExists = insight.Utils.takeWhere(dim.filters, nameProperty, filterFunc.name)
                    .length;

                //if the dimension is already filtered by this value, toggle (remove) the filter
                if (filterExists) {
                    insight.Utils.removeWhere(dim.filters, nameProperty, filterFunc.name);

                } else {
                    // add the provided filter to the list for this dimension

                    dim.filters.push(filterFunc);
                }

                // reset this dimension if no filters exist, else apply the filter to the dataset.
                if (dim.filters.length === 0) {

                    insight.Utils.removeItemFromArray(self.filteredDimensions, dim);
                    dim.crossfilterDimension.filterAll();

                } else {
                    dim.crossfilterDimension.filter(function(d) {

                        // apply all of the filters on this dimension to the current value, returning an array of 
                        // true/false values (which filters does it satisfy)
                        var vals = dim.filters
                            .map(function(func) {
                                return func.filterFunction(d);
                            });

                        // if this value satisfies any of the filters, it should be kept
                        var matchesAnyFilter = vals.filter(function(result) {
                                return result;
                            })
                            .length > 0;

                        return matchesAnyFilter;
                    });
                }
            });

            // the above filtering will have triggered a re-aggregation of the groupings.  We must manually
            // initiate the recalculation of the groupings for any post aggregation calculations
            self.groupings.forEach(function(group) {
                group.recalculate();

            });

            self.draw();

        };
    };

})(insight);
