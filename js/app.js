
function Investor()
{
    var name;
    var age;
    var retirementAge;
    var retirementIncome;
    



};

function Portfolio()
{
    this.name='unnamed';
    this.assets=[];
    this.initialValue=0;
    this.monthlyInvestment=0;

    this.addAsset=function(asset){this.assets[this.assets.length]=asset;};

    this.getValue=getValue;

    function getValue(date)
    {
        var total=0;
        for(var i=0;i<this.assets.length;i++)
        {
            total+=this.assets[i].getValue(this,date);
        }

        return total;
    }
}
function Asset()
{
    this.name='unnamed';
    this.taxable=true;
    this.taxDefered=false;
    this.targetPercentage=1.0;
    this.expectedAvgReturn=1.05;

    this.getValue=getValue;

    function getValue(portfolio,date)
    {
        var amount=computeValue(portfolio.initialValue*this.targetPercentage,portfolio.monthlyInvestment*this.targetPercentage,date)
        return amount;
    }

    function computeValue(initialValue,monthlyInvestment,date)
    {
        var numMonths=monthsFromNow(date);
        var amount=initialValue;
        var avgMonthlyReturn=monthlyReturnFromAnnualReturn(this.expectedAvgReturn);
        for(var i=0;i<numMonths;i++)
        {
            amount=(amount*avgMonthlyReturn)+monthlyInvestment;
        }
        return amount;
    }
    function monthsFromNow(date)
    {
        var now=new Date();
        var months=(date.getFullYear() - now.getFullYear())*12;
        months+=(date.getMonth() - now.getMonth());
        return months;
    }
    function monthlyReturnFromAnnualReturn(annualReturn)
    {
        // what is N for N^12=annualReturn?
        return Math.pow(annualReturn,1/12);
    }
}





