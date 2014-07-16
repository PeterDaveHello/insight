describe('Chart', function() {
    
    describe('constructor', function() {

        it('sets name', function() {

            var chart = new insight.Chart('somename', 'asdads', 'ada');

            expect(chart.name).toBe('somename');

        });

        it('sets element', function() {

            var chart = new insight.Chart('somename', 'somelement', 'ada');

            expect(chart.element).toBe('somelement');

        });

    });

    describe('defaults', function() {

        var chart;

        beforeEach(function() {
            chart = new insight.Chart();
        });

        it('selectedItems empty', function() {

            expect(chart.selectedItems).toEqual([]);

        });

        it('container null', function() {

            expect(chart.container).toBeNull();

        });

        it('height 300', function() {

            expect(chart.height()).toBe(300);

        });

        it('width 300', function() {

            expect(chart.width()).toBe(300);

        });

        it('margin {0,0,0,0}', function() {

            expect(chart.margin()).toEqual({
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            });

        });

        it('series empty', function() {

            expect(chart.series()).toEqual([]);

        });

        it('axes empty', function() {

            expect(chart.axes()).toEqual([]);

        });

        it('barPadding 0.1', function() {

            expect(chart.barPadding()).toBe(0.1);

        });

        it('title empty', function() {

            expect(chart.title()).toBe('');

        });
    });

    describe('gets and sets', function() {

        var chart;

        beforeEach(function() {
            chart = new insight.Chart('asda', 'asdads', 'ada');
        });

        it('title', function() {

            var result = chart.title('Test Chart');

            expect(chart.title()).toBe('Test Chart');
            expect(result).toBe(chart);
        });

        it('width', function() {

            var result = chart.width(123);

            expect(chart.width()).toBe(123);
            expect(result).toBe(chart);
        });

        it('height', function() {

            var result = chart.height(500);

            expect(chart.height()).toBe(500);
            expect(result).toBe(chart);
        });

        it('margin', function() {

            var result = chart.margin({
                top: 1,
                left: 2,
                right: 3,
                bottom: 4
            });

            expect(chart.margin()).toEqual({
                top: 1,
                left: 2,
                right: 3,
                bottom: 4
            });
            expect(result).toBe(chart);
        });

        it('series', function() {

            var s = {};
            var result = chart.series(s);

            expect(chart.series()).toBe(s);
            expect(result).toBe(chart);
        });

        it('autoMargin', function() {

            var result = chart.autoMargin(true);

            expect(chart.autoMargin()).toBe(true);
            expect(result).toBe(chart);
        });

    });

    describe('addAxis', function() {

        it('adds to axes', function() {

            var chart = new insight.Chart();

            expect(chart.axes()).toEqual([]);

            var a = {};

            chart.addAxis(a);

            expect(chart.axes()[0]).toBe(a);

        });

    });

    describe('init', function() {

        describe('with no arguments', function() {
            var chart, reald3;

            var testInit = function(setup) {

                if(arguments.length){
                    setup();
                }
                
                d3 = new D3Mocks();

                // prevent calling through to functions that are not being tested
                spyOn(chart, 'tooltip');
                spyOn(chart, 'draw');
                spyOn(chart, 'addClipPath');

                chart.init();

            };

            beforeEach(function(){

                reald3 = d3;  

                chart = new insight.Chart('ChartName');                

            });

            afterEach(function() {

                d3 = reald3;

            });

            describe('sets chart div', function() {

                it('class', function() {

                    testInit();

                    expect(d3.elements['div'].attrs['class']).toEqual(insight.Constants.ContainerClass);

                });

                it('width', function() {

                    testInit(function() {
                        chart.width(12345);
                    });

                    expect(d3.elements['div'].styles['width']).toEqual('12345px');

                });

                it('position', function() {

                    testInit();

                    expect(d3.elements['div'].styles['position']).toEqual('relative');

                });

                it('display', function() {

                    testInit();

                    expect(d3.elements['div'].styles['display']).toEqual('inline-block');

                });

            });

            describe('sets chart svg', function() {

                it('class', function() {

                    testInit();

                    expect(d3.elements['svg'].attrs['class']).toEqual(insight.Constants.ChartSVG);

                });

                it('width', function() {

                    testInit(function() {
                        chart.width(345);
                    });

                    expect(d3.elements['svg'].attrs['width']).toEqual(345);

                });

                it('height', function() {

                    testInit(function() {
                        chart.height(999);
                    });

                    expect(d3.elements['svg'].attrs['height']).toEqual(999);

                });

            });

            describe('sets chart g', function() {

                it('class', function() {

                    testInit();

                    expect(d3.elements['g'].attrs['class']).toEqual(insight.Constants.Chart);

                });

                it('transform', function() {

                    testInit(function() {
                        chart.margin({
                            left: 1,
                            right: 2,
                            top: 3,
                            bottom: 4
                        });
                    });

                    expect(d3.elements['g'].attrs['transform']).toEqual('translate(1,3)');

                });

            });

            describe('calls', function() {

                it('addClipPath', function() {

                    testInit();

                    expect(chart.addClipPath).toHaveBeenCalled();

                });

                it('tooltip', function() {

                    testInit();

                    expect(chart.tooltip).toHaveBeenCalled();

                });

                it('draw', function() {

                    testInit();

                    expect(chart.draw).toHaveBeenCalledWith(false);

                });

                it('initialize on all axes', function() {

                    var axes = [
                        { initialize: function () {} },
                        { initialize: function () {} },
                        { initialize: function () {} }
                    ];

                    testInit(function() {

                        axes.forEach(function(axis) {

                            chart.addAxis(axis);
                            spyOn(axis, 'initialize');

                        });

                    });

                    axes.forEach(function(axis) {

                        expect(axis.initialize).toHaveBeenCalled();

                    });

                });

                it('initZoom if zoomable', function() {

                    testInit(function() {

                        chart.zoomable(2);
                        spyOn(chart, 'initZoom');

                    });

                    expect(chart.initZoom).toHaveBeenCalled();

                });

                it('no initZoom if not zoomable', function() {

                    testInit(function() {

                        spyOn(chart, 'initZoom');

                    });

                    expect(chart.initZoom).not.toHaveBeenCalled();

                });

            });
        });
    });
});