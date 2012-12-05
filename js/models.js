(function($){
    
    window.Portfolio=Backbone.Model.extend({
        defaults:{
            assets:[]        
                 },
        initialize:function(){
                   
        }
    });

    window.Portfolios=Backbone.Collection.extend({
        model:Portfolio,
        //url:"portfolios",
        localStorage:new Store('portfolios'), //new Store("portfolios"),
        sumAssetClasses:function(){
            var assetClassMap={};
            // gather up asset classes from portfolios
            for(var i=0;i<this.models.length;i++)
            {
                var portfolio=this.models[i];
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
            }
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
        window.PortfolioAssetView=Backbone.View.extend({
            initialize:function()
            {   
                _.bindAll(this,'render');
               // this.model.bind('destroy',this.remove);
            },
            appendAsset:function(asset){
                var that=this;
                var assets=that.model.get('assets');
                $('#portfolio-assets').append($('<tr>')
                    .append($('<td>',{'text':asset.name}))
                    .append($('<td>',{'text':asset.assetClass}))
                    .append($('<td>',{'text':asset.currentValue}))
                    .append($('<td>').append($('<i>',{'class':'icon-remove-sign'}).click(function(){if(confirm('Remove asset '+asset.name+'?')){ assets.splice(assets.indexOf(asset),1);that.render();plotAllocation(window.portfolios);  }})).append(
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
        window.portfolioListView=new PortfolioListView({collection:window.portfolios});
        window.portfolioAssetView=null; //new PortfolioAssetView();
        window.portfolios.fetch();
        window.portfolio=null;
        window.portfolioListView.render();
        if(window.portfolios.models.length>0)
        {
            window.portfolio=window.portfolios.models[0];
            window.portfolioAssetView=new PortfolioAssetView({model:window.portfolio});
            window.portfolioAssetView.render();
        }
    });
})(jQuery);
