(function($){
   
    window.AssetAllocationProfile=Backbone.Model.extend({
        //localStorage:new Store('profile'), 
        defaults:{
            assetClasses:[]             
        },
    initialize:function(){
        },
    addAssetClass:function(assetClass){
        console.log('addAssetClass:'+assetClass.assetClass);
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
            console.log('save');
         window.localStorage.setItem('assetClasses',JSON.stringify(this.get('assetClasses')));
         
         }
    
    });

    window.Portfolio=Backbone.Model.extend({
        defaults:{
            assets:[]        
                 },
        initialize:function(){
                   
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
            tagName:'li',
            className:'portfolio',
            initialize:function(){
                _.bindAll(this,'render');
                this.model.bind('change',this.render);
            },
            render:function(){
                $(this.el).html(this.template(this.model.toJSON()));
                return this;
            }
        });

        window.AssetAllocationProfileView=Backbone.View.extend(
        {
            initialize:function()
            {   
                _.bindAll(this,'render');
            },
            appendAssetClass:function(asset){
                console.log('appendAssetClass: '+asset.assetClass);
                var that=this;
                $('#asset-allocation-profile-assets').append($('<tr>')
                    .append($('<td>',{'text':asset.assetClass}))
                    .append($('<td>',{'text':asset.target}))
                    .append($('<td>').append($('<i>',{'class':'icon-remove-sign'}).click(function(){if(confirm('Remove asset class '+asset.assetClass+'?')){ that.model.destroyAssetClass(asset);  }})).append(
                            $('<i>',{'class':'icon-edit'}).click(function(){alert('edit asset class:'+asset.assetClass);})
                    )));
            },
            render:function(){
                  console.log('render');
                  var that=this;
                  $('#asset-allocation-profile-assets').html("");
                  _.each(this.model.get('assetClasses'),function(asset){
                    that.appendAssetClass(asset);
                  });
                  return this;
            }
        }
        );
        window.PortfolioAssetView=Backbone.View.extend({
            initialize:function()
            {   
                _.bindAll(this,'render');
            },
            appendAsset:function(asset){
                var that=this;
                $('#portfolio-assets').append($('<tr>')
                    .append($('<td>',{'text':asset.name}))
                    .append($('<td>',{'text':asset.assetClass}))
                    .append($('<td>',{'text':asset.currentValue}))
                    .append($('<td>').append($('<i>',{'class':'icon-remove-sign'}).click(function(){if(confirm('Remove asset '+asset.name+'?')){ that.model.destroyAsset(asset);  }})).append(
                            $('<i>',{'class':'icon-edit'}).click(function(){alert('edit asset:'+asset.name);})
                    )));
            },
            render:function(){
                  var that=this;
                  $('#portfolio-detail-name').html(this.model.get('name')).append($('<i>',{'class':'icon-remove-sign'}).click(function(){if(confirm('Delete portfolio?')){that.model.destroy();}}));
                  $('#portfolio-assets').html("");
                  _.each(this.model.get('assets'),function(asset){
                    that.appendAsset(asset);
                  });
                  return this;
            }
        }),
        
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
                 $(e).click(function(){
                     window.portfolio=portfolio;
                     window.portfolioAssetView=new PortfolioAssetView({model:window.portfolio});
                     window.portfolioAssetView.render();
                 });
                $(this.el).append(e); 
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
        window.portfolioAssetView=null; 
        window.portfolios.fetch();
        window.portfolios.each(function(portfolio){
            portfolio.on('changeassets',function(event){
                window.portfolioAssetView.render();
                plotAllocation(window.portfolios);
            });
        });
        window.portfolio=null;
        window.profile=null;
        window.portfolioListView.render();
        if(window.portfolios.models.length>0)
        {
            window.portfolio=window.portfolios.models[0];
            window.portfolioAssetView=new PortfolioAssetView({model:window.portfolio});
            window.portfolioAssetView.render();
        }

        
        window.profile=new AssetAllocationProfile();
        window.profile.load();

        window.profileView=new AssetAllocationProfileView({model:window.profile});
        window.profileView.render();

        window.profile.on('changeassetclasses',function(event){
            window.profileView.render();
        });
    });
})(jQuery);
