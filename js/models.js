(function($){
   
    window.AssetAllocationProfile=Backbone.Model.extend({
        defaults:{
            assetClasses:[]             
        },
    initialize:function(){
        },
    addAssetClass:function(assetClass){
        this.get('assetClasses').push(assetClass);
        this.trigger('changeassetclasses',assetClass);
        this.save();
    }
    ,
    destroyAssetClass:function(obj){
        var assetClasses=this.get('assetClasses');
        assetClasses.splice(assetClasses.indexOf(obj),1);
        this.trigger('changeassetclasses',obj);
        this.save();
    },
    load:function(){
         this.set('assetClasses',JSON.parse(
             window.localStorage.getItem('assetClasses'))||[]);

         },
    save:function(){
         window.localStorage.setItem('assetClasses',JSON.stringify(this.get('assetClasses')));
         
         }
    
    });

    window.Portfolio=Backbone.Model.extend({
        defaults:{
            assets:[]        
                 },
        initialize:function(){
                   
        },
        sumAssetClasses:function(){
            var assetClassMap={};
            // gather up asset classes from portfolios
            var assets=this.get('assets')
            for(var j=0;j<assets.length;j++)
            {
                var asset=assets[j];
                var assetClass=asset.assetClass;
                var value=Number(asset.currentValue);
                if (assetClass in assetClassMap)
                    assetClassMap[assetClass]+=value;
                else
                    assetClassMap[assetClass]=value;
            }
            // plot totals for each asset class into pie chart
            var data=[];
            for(var assetClass in assetClassMap)
            {
                data[data.length]={ label:assetClass, data:assetClassMap[assetClass]};
            }
            return data;
        },
        
        addAsset:function(asset){
            this.get('assets').push(asset);
            this.trigger('changeassets',asset);
            this.save();
        },
        destroyAsset:function(asset){
            var assets=this.get('assets');
            assets.splice(assets.indexOf(asset),1);
            this.trigger('changeassets',asset);
            this.save();
        }
    });

    window.Portfolios=Backbone.Collection.extend({
        model:Portfolio,
        localStorage:new Store('portfolios'), 
        getAssetClassValue:function(assetClass){
            // get total value for this asset class from all portfolios
            var assetTotal=0;
            var total=0;
            // also get total value of all portfolios to calculate asset class allocation
            _.each(this.models,function(portfolio){
                var assets=portfolio.get('assets')
                for(var j=0;j<assets.length;j++)
                {
                    var asset=assets[j];
                    if(asset.assetClass==assetClass)
                    {
                        assetTotal+=asset.currentValue;
                    }
                    total+=asset.currentValue;
                } 
            });
            return {'currentValue':assetTotal,'percentage':(assetTotal/total)};
         }   
        ,
        sumAssetClasses:function(){
            var assetClassMap={};
            // gather up asset classes from portfolios
            _.each(this.models,function(portfolio){
                var assets=portfolio.get('assets')
                for(var j=0;j<assets.length;j++)
                {
                    var asset=assets[j];
                    var assetClass=asset.assetClass;
                    var value=Number(asset.currentValue);
                    if (assetClass in assetClassMap)
                        assetClassMap[assetClass]+=value;
                    else
                        assetClassMap[assetClass]=value;
                }
            });
            // plot totals for each asset class into pie chart
            var data=[];
            for(var assetClass in assetClassMap)
            {
                data[data.length]={ label:assetClass, data:assetClassMap[assetClass]};
            }
            return data;
        }
    });


    $(document).ready(function(){
       
        window.PortfolioView=Backbone.View.extend({
            template:_.template($('#portfolio-template').html()),
            tagName:'div',
            className:'row-fluid',

            events:{
                "click .add-asset-btn":"addAsset", 
                "keypress .currentValue":"updateOnEnter",
                "blur .currentValue":"close"
            },

            addAsset:function(){
                var portfolio=this.model;
                if(!portfolio) return false;
                var name=this.$('.add-asset-name').val();
                var assetClass=this.$('.add-asset-class').val();
                var currentValue=Number(this.$('.add-asset-value').val());
                if(!name || !assetClass || !currentValue)
                {
                    alert("Please enter all form fields.");
                    return false;
                }
                portfolio.addAsset({'name':name,'assetClass':assetClass,'currentValue':currentValue});
                this.$('.add-asset-name').val('');
                this.$('.add-asset-class').val('');
                this.$('.add-asset-value').val('');
                this.render();
                return false; 
            },
            updateOnEnter:function(e){
              if(e.keyCode==13) {
                  this.close();
              }
            },
            close:function(e){
                $.each(this.$('.currentValue'),function(i,input){
                    var asset=$(input).data('asset');
                    if(asset)
                    {
                        asset.currentValue=Number($(input).val());
                    }
                });
                this.model.trigger('changeassets',this);
                this.model.save();
                this.renderChart();
            },
            initialize:function(){
                _.bindAll(this,'render');
                this.model.bind('change',this.render);
            },
            renderChart:function(){
                try{
                    $.plot(this.$('.portfolio-allocation-pie'),this.model.sumAssetClasses(),{ series:{pie:{show:true}}   });
                }
                catch(e)
                {
                }
            },
            render:function(){
                $(this.el).html(this.template(this.model.toJSON()));
                var assets=this.model.get('assets');
                $.each(this.$('.currentValue'),function(i,input){
                    $(input).data('asset',assets[i]);
                });
                this.renderChart();
                return this;
            }
        });

        window.AssetAllocationProfileView=Backbone.View.extend(
        {
            el:'#asset-allocation-profile',
            template:_.template($('#asset-allocation-profile-template').html()),

            events:{
                "click .add-asset-class-btn":"addAssetClass", 
                "keypress .target":"updateOnEnter",
                "blur .target":"close"
            },
            addAssetClass:function()
            {
                console.log('addAssetClass');
                var profile=this.model;
                if(!profile) return;
                var assetClass=this.$(".profile-add-asset-class").val();
                var assetTarget=Number(this.$(".profile-add-asset-target").val());

                if(!assetClass || !assetTarget)
                {
                    alert("Please fill in all form fields.");
                    return false;
                }
                profile.addAssetClass({'assetClass':assetClass,'target':assetTarget});
                this.$(".profile-add-asset-class").val('');
                this.$(".profile-add-asset-target").val('');
                this.render();
                return false;
            },
            updateOnEnter:function(e){
              if(e.keyCode==13) {
                  this.close();
              }
            },
            close:function(e){
                $.each(this.$('.target'),function(i,input){
                    var assetClass=$(input).data('assetClass');
                    if(assetClass)
                    {
                        assetClass.target=Number($(input).val());
                    }
                });
                //this.model.trigger('changeassets',this);
                this.model.save();
            },
            initialize:function()
            {   
                _.bindAll(this,'render');
            },
            /*appendAssetClass:function(asset){
                var that=this;
                var assetValue=window.portfolios.getAssetClassValue(asset.assetClass);

                $('#asset-allocation-profile-assets').append($('<tr>')
                    .append($('<td>',{'text':asset.assetClass}))
                    .append($('<td>',{'text':asset.target}))
                    .append($('<td>',{'text':assetValue.currentValue}))
                    .append($('<td>',{'text':Math.floor(assetValue.percentage*100.0)}))
                    .append($('<td>').append($('<i>',{'class':'icon-remove-sign'}).click(function(){if(confirm('Remove asset class '+asset.assetClass+'?')){ that.model.destroyAssetClass(asset);  }})).append(
                            $('<i>',{'class':'icon-edit'}).click(function(){alert('edit asset class:'+asset.assetClass);})
                    )));
            },*/
            render:function(){
                $(this.el).html(this.template(this.model.toJSON()));
                var assetClasses=this.model.get('assetClasses');
                $.each(this.$('.target'),function(i,input){
                    $(input).data('assetClass',assetClasses[i]);
                });
                  return this;
            }
        }
        );
        
        window.PortfolioListView=Backbone.View.extend({
            el:'#portfolios',
            initialize:function(){
                _.bindAll(this,'render');
                this.collection.bind('remove',this.render);
                this.collection.bind('add',this.render);
            },
            appendPortfolio:function(portfolio){
                var v=new PortfolioView({model:portfolio});
                 var e=v.render().el;
                $(this.el).append(e);
                v.renderChart();
            },
            render:function(){
                  $(this.el).html('');
                  var that=this;
                  this.collection.each(function(portfolio){
                      that.appendPortfolio(portfolio);
                  });
                  return this;
            }
        });
        
        window.portfolios=new Portfolios();
        window.portfolios.bind('remove',function(event){
            plotAllocation(window.portfolios);
        });
        window.portfolioListView=new PortfolioListView({collection:window.portfolios});
        window.portfolios.fetch();
        window.portfolios.each(function(portfolio){
            portfolio.on('changeassets',function(event){
                window.profileView.render();
                plotAllocation(window.portfolios);
            });
        });
        window.portfolio=null;
        window.profile=null;
        window.portfolioListView.render();
        window.profile=new AssetAllocationProfile();
        window.profile.load();
        window.profileView=new AssetAllocationProfileView({model:window.profile});
        window.profileView.render();
        window.profile.on('changeassetclasses',function(event){
            window.profileView.render();
        });
    });
})(jQuery);
