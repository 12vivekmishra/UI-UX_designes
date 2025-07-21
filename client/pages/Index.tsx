import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  PiggyBank, 
  Target,
  Moon,
  Sun,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart3,
  Wallet,
  ArrowDown
} from "lucide-react";

interface LoanData {
  loanAmount: number;
  interestRate: number;
  tenure: number;
}

interface SIPData {
  sipAmount: number;
  sipReturnRate: number;
  sipTenure: number;
}

interface Scenario {
  id: number;
  name: string;
  loan: LoanData;
  sip: SIPData;
  color: string;
}

interface CalculationResults {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  sipMaturityValue: number;
  sipTotalInvestment: number;
  sipReturns: number;
  netPosition: number;
  earlyClosureSavings: number;
}

interface AmortizationEntry {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

interface SIPGrowthEntry {
  month: number;
  investment: number;
  balance: number;
  returns: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Index() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 1,
      name: "Scenario 1",
      loan: { loanAmount: 5000000, interestRate: 8.5, tenure: 20 },
      sip: { sipAmount: 25000, sipReturnRate: 12, sipTenure: 20 },
      color: COLORS[0]
    }
  ]);
  const [activeScenario, setActiveScenario] = useState(1);
  const [showAmortization, setShowAmortization] = useState(false);
  const [showSIPGrowth, setShowSIPGrowth] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Scroll to calculator
  const scrollToCalculator = () => {
    const calculatorElement = document.getElementById('calculator');
    calculatorElement?.scrollIntoView({ behavior: 'smooth' });
  };

  // Financial calculations
  const calculateEMI = useCallback((principal: number, rate: number, tenure: number): number => {
    const monthlyRate = rate / 100 / 12;
    const totalMonths = tenure * 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                 (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(emi);
  }, []);

  const calculateSIPMaturity = useCallback((monthlyAmount: number, rate: number, years: number): number => {
    const monthlyRate = rate / 100 / 12;
    const totalMonths = years * 12;
    const maturityValue = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    return Math.round(maturityValue);
  }, []);

  const calculateResults = useCallback((scenario: Scenario): CalculationResults => {
    const { loan, sip } = scenario;
    const emi = calculateEMI(loan.loanAmount, loan.interestRate, loan.tenure);
    const totalPayment = emi * loan.tenure * 12;
    const totalInterest = totalPayment - loan.loanAmount;
    
    const sipMaturityValue = calculateSIPMaturity(sip.sipAmount, sip.sipReturnRate, sip.sipTenure);
    const sipTotalInvestment = sip.sipAmount * sip.sipTenure * 12;
    const sipReturns = sipMaturityValue - sipTotalInvestment;
    
    const netPosition = sipMaturityValue - totalPayment;
    const earlyClosureSavings = totalInterest * 0.3; // Estimated 30% savings on early closure
    
    return {
      emi,
      totalInterest,
      totalPayment,
      sipMaturityValue,
      sipTotalInvestment,
      sipReturns,
      netPosition,
      earlyClosureSavings
    };
  }, [calculateEMI, calculateSIPMaturity]);

  // Generate amortization schedule
  const generateAmortizationSchedule = useCallback((loan: LoanData): AmortizationEntry[] => {
    const schedule: AmortizationEntry[] = [];
    const emi = calculateEMI(loan.loanAmount, loan.interestRate, loan.tenure);
    const monthlyRate = loan.interestRate / 100 / 12;
    let balance = loan.loanAmount;
    
    for (let month = 1; month <= loan.tenure * 12; month++) {
      const interestAmount = balance * monthlyRate;
      const principalAmount = emi - interestAmount;
      balance -= principalAmount;
      
      schedule.push({
        month,
        emi,
        principal: Math.round(principalAmount),
        interest: Math.round(interestAmount),
        balance: Math.round(Math.max(0, balance))
      });
    }
    
    return schedule;
  }, [calculateEMI]);

  // Generate SIP growth schedule
  const generateSIPGrowthSchedule = useCallback((sip: SIPData): SIPGrowthEntry[] => {
    const schedule: SIPGrowthEntry[] = [];
    const monthlyRate = sip.sipReturnRate / 100 / 12;
    let balance = 0;
    
    for (let month = 1; month <= sip.sipTenure * 12; month++) {
      balance = (balance + sip.sipAmount) * (1 + monthlyRate);
      const totalInvestment = sip.sipAmount * month;
      const returns = balance - totalInvestment;
      
      schedule.push({
        month,
        investment: totalInvestment,
        balance: Math.round(balance),
        returns: Math.round(returns)
      });
    }
    
    return schedule;
  }, []);

  // Update scenario
  const updateScenario = (id: number, updates: Partial<Scenario>) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.id === id ? { ...scenario, ...updates } : scenario
    ));
  };

  // Add new scenario
  const addScenario = () => {
    if (scenarios.length >= 3) return;
    
    const newScenario: Scenario = {
      id: scenarios.length + 1,
      name: `Scenario ${scenarios.length + 1}`,
      loan: { loanAmount: 5000000, interestRate: 8.5, tenure: 20 },
      sip: { sipAmount: 25000, sipReturnRate: 12, sipTenure: 20 },
      color: COLORS[scenarios.length]
    };
    
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenario(newScenario.id);
  };

  // Remove scenario
  const removeScenario = (id: number) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter(scenario => scenario.id !== id));
    if (activeScenario === id) {
      setActiveScenario(scenarios[0].id);
    }
  };

  // Memoized calculations
  const allResults = useMemo(() => {
    return scenarios.map(scenario => ({
      scenario,
      results: calculateResults(scenario)
    }));
  }, [scenarios, calculateResults]);

  const activeResults = useMemo(() => {
    const activeScenarioData = scenarios.find(s => s.id === activeScenario);
    return activeScenarioData ? calculateResults(activeScenarioData) : null;
  }, [scenarios, activeScenario, calculateResults]);

  // Chart data
  const chartData = useMemo(() => {
    const years = Math.max(...scenarios.map(s => s.loan.tenure));
    const data = [];
    
    for (let year = 1; year <= years; year++) {
      const yearData: any = { year };
      
      scenarios.forEach(scenario => {
        const results = calculateResults(scenario);
        const remainingBalance = scenario.loan.loanAmount * (1 - (year / scenario.loan.tenure));
        const sipGrowth = calculateSIPMaturity(scenario.sip.sipAmount, scenario.sip.sipReturnRate, year);
        
        yearData[`loan_${scenario.id}`] = Math.max(0, remainingBalance);
        yearData[`sip_${scenario.id}`] = sipGrowth;
        yearData[`net_${scenario.id}`] = sipGrowth - remainingBalance;
      });
      
      data.push(yearData);
    }
    
    return data;
  }, [scenarios, calculateResults, calculateSIPMaturity]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const currentScenario = scenarios.find(s => s.id === activeScenario);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 financial-gradient opacity-90" />
        <div className="absolute inset-0 glassmorphism" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="mb-8 neumorph-outset rounded-3xl p-8 bg-white/10 dark:bg-white/5 sm:block flex flex-col">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
              LoanCalc
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
              Home Loan + SIP Financial Planner
            </p>
            <p className="text-lg text-white/80 mb-12 max-w-2xl sm:mx-auto mx-auto leading-relaxed">
              Make informed financial decisions with our comprehensive loan and investment calculator. 
              Plan your home loan EMIs alongside SIP investments for optimal wealth creation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                onClick={scrollToCalculator}
                className="bg-white text-financial-600 hover:bg-white/90 px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                <Calculator className="mr-2 h-6 w-6" />
                Get Started
              </Button>
              
              <div className="flex items-center space-x-4">
                <Sun className="h-5 w-5 text-white" />
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={setIsDarkMode}
                  className="data-[state=checked]:bg-white/20"
                />
                <Moon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="animate-bounce mt-12">
            <ArrowDown className="h-8 w-8 text-white mx-auto" />
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Financial Calculator
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Configure your loan and SIP parameters to see detailed projections and make informed decisions
            </p>
          </div>

          {/* Scenario Management */}
          <div className="mb-8 flex flex-wrap gap-4 justify-center">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="relative flex items-center">
                <Button
                  variant={activeScenario === scenario.id ? "default" : "outline"}
                  onClick={() => setActiveScenario(scenario.id)}
                  className="neumorph rounded-xl"
                  style={{ borderColor: scenario.color }}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: scenario.color }}
                  />
                  {scenario.name}
                </Button>
                {scenarios.length > 1 && (
                  <button
                    onClick={() => removeScenario(scenario.id)}
                    className="ml-2 p-1 text-destructive hover:text-destructive/80 rounded-full hover:bg-destructive/10 transition-colors"
                    aria-label={`Remove ${scenario.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {scenarios.length < 3 && (
              <Button 
                variant="outline" 
                onClick={addScenario}
                className="neumorph rounded-xl"
              >
                + Add Scenario
              </Button>
            )}
          </div>

          {currentScenario && (
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Loan Calculator */}
              <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                    <DollarSign className="h-7 w-7 text-financial-500" />
                    Home Loan Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Loan Amount */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Loan Amount
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total amount you want to borrow for your home</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-semibold text-financial-600">
                        {formatCurrency(currentScenario.loan.loanAmount)}
                      </span>
                    </div>
                    <Slider
                      value={[currentScenario.loan.loanAmount]}
                      onValueChange={([value]) => 
                        updateScenario(activeScenario, { 
                          loan: { ...currentScenario.loan, loanAmount: value }
                        })
                      }
                      min={1000000}
                      max={20000000}
                      step={100000}
                      className="neumorph rounded-full p-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹10L</span>
                      <span>₹2Cr</span>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Interest Rate
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Annual interest rate offered by your bank</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-semibold text-financial-600">
                        {currentScenario.loan.interestRate}%
                      </span>
                    </div>
                    <Slider
                      value={[currentScenario.loan.interestRate]}
                      onValueChange={([value]) => 
                        updateScenario(activeScenario, { 
                          loan: { ...currentScenario.loan, interestRate: value }
                        })
                      }
                      min={6}
                      max={15}
                      step={0.1}
                      className="neumorph rounded-full p-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>6%</span>
                      <span>15%</span>
                    </div>
                  </div>

                  {/* Loan Tenure */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Loan Tenure
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of years to repay the loan</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-semibold text-financial-600">
                        {currentScenario.loan.tenure} years
                      </span>
                    </div>
                    <Slider
                      value={[currentScenario.loan.tenure]}
                      onValueChange={([value]) => 
                        updateScenario(activeScenario, { 
                          loan: { ...currentScenario.loan, tenure: value }
                        })
                      }
                      min={5}
                      max={30}
                      step={1}
                      className="neumorph rounded-full p-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 years</span>
                      <span>30 years</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SIP Calculator */}
              <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                    <TrendingUp className="h-7 w-7 text-financial-500" />
                    SIP Investment Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* SIP Amount */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Monthly SIP Amount
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Amount you plan to invest monthly in SIP</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-semibold text-financial-600">
                        {formatCurrency(currentScenario.sip.sipAmount)}
                      </span>
                    </div>
                    <Slider
                      value={[currentScenario.sip.sipAmount]}
                      onValueChange={([value]) => 
                        updateScenario(activeScenario, { 
                          sip: { ...currentScenario.sip, sipAmount: value }
                        })
                      }
                      min={5000}
                      max={100000}
                      step={1000}
                      className="neumorph rounded-full p-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹5K</span>
                      <span>₹1L</span>
                    </div>
                  </div>

                  {/* SIP Return Rate */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Expected Annual Returns
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Expected annual return rate from your SIP investments</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-semibold text-financial-600">
                        {currentScenario.sip.sipReturnRate}%
                      </span>
                    </div>
                    <Slider
                      value={[currentScenario.sip.sipReturnRate]}
                      onValueChange={([value]) => 
                        updateScenario(activeScenario, { 
                          sip: { ...currentScenario.sip, sipReturnRate: value }
                        })
                      }
                      min={8}
                      max={20}
                      step={0.5}
                      className="neumorph rounded-full p-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>8%</span>
                      <span>20%</span>
                    </div>
                  </div>

                  {/* SIP Tenure */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          Investment Period
                        </label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of years you plan to continue SIP</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-lg font-semibold text-financial-600">
                        {currentScenario.sip.sipTenure} years
                      </span>
                    </div>
                    <Slider
                      value={[currentScenario.sip.sipTenure]}
                      onValueChange={([value]) => 
                        updateScenario(activeScenario, { 
                          sip: { ...currentScenario.sip, sipTenure: value }
                        })
                      }
                      min={5}
                      max={30}
                      step={1}
                      className="neumorph rounded-full p-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 years</span>
                      <span>30 years</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Section */}
          {activeResults && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <Card className="neumorph-outset rounded-2xl border-0 bg-card/50 backdrop-blur-sm overflow-hidden group hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-full bg-destructive/10">
                        <Wallet className="h-6 w-6 text-destructive" />
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total interest you'll pay over the loan tenure</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Interest Paid</h3>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(activeResults.totalInterest)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      EMI: {formatCurrency(activeResults.emi)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="neumorph-outset rounded-2xl border-0 bg-card/50 backdrop-blur-sm overflow-hidden group hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-full bg-green-500/10">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total returns from your SIP investments</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">SIP Returns</h3>
                    <p className="text-2xl font-bold text-green-500">
                      {formatCurrency(activeResults.sipReturns)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Maturity: {formatCurrency(activeResults.sipMaturityValue)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="neumorph-outset rounded-2xl border-0 bg-card/50 backdrop-blur-sm overflow-hidden group hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-full ${activeResults.netPosition >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                        <Target className="h-6 w-6" className={activeResults.netPosition >= 0 ? 'text-green-500' : 'text-destructive'} />
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Net financial position (SIP maturity - Total loan payment)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Financial Position</h3>
                    <p className={`text-2xl font-bold ${activeResults.netPosition >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {formatCurrency(activeResults.netPosition)}
                    </p>
                    <Badge variant={activeResults.netPosition >= 0 ? "default" : "destructive"} className="mt-2">
                      {activeResults.netPosition >= 0 ? "Positive" : "Negative"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="neumorph-outset rounded-2xl border-0 bg-card/50 backdrop-blur-sm overflow-hidden group hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-full bg-financial-500/10">
                        <PiggyBank className="h-6 w-6 text-financial-500" />
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Potential savings from early loan closure</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Early Closure Savings</h3>
                    <p className="text-2xl font-bold text-financial-500">
                      {formatCurrency(activeResults.earlyClosureSavings)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Estimated savings
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="space-y-8">
                <Tabs defaultValue="comparison" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 neumorph rounded-2xl bg-muted/50 p-1">
                    <TabsTrigger value="comparison" className="rounded-xl text-xs sm:text-sm">Comparison Chart</TabsTrigger>
                    <TabsTrigger value="breakdown" className="rounded-xl text-xs sm:text-sm">Loan Breakdown</TabsTrigger>
                    <TabsTrigger value="growth" className="rounded-xl text-xs sm:text-sm">SIP Growth</TabsTrigger>
                  </TabsList>

                  <TabsContent value="comparison" className="mt-8">
                    <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <BarChart3 className="h-6 w-6 text-financial-500" />
                          Financial Projection Comparison
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="year" />
                              <YAxis 
                                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                              />
                              <RechartsTooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={(year) => `Year ${year}`}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: 'none',
                                  borderRadius: '12px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                }}
                              />
                              <Legend />
                              {scenarios.map((scenario) => (
                                <Line
                                  key={`net_${scenario.id}`}
                                  type="monotone"
                                  dataKey={`net_${scenario.id}`}
                                  stroke={scenario.color}
                                  strokeWidth={3}
                                  name={`${scenario.name} Net Position`}
                                  dot={{ r: 4 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="breakdown" className="mt-8">
                    <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <DollarSign className="h-6 w-6 text-financial-500" />
                          Loan Payment Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Principal', value: currentScenario!.loan.loanAmount, fill: '#10B981' },
                                  { name: 'Interest', value: activeResults.totalInterest, fill: '#EF4444' }
                                ]}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                              >
                                {[0, 1].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="growth" className="mt-8">
                    <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <TrendingUp className="h-6 w-6 text-financial-500" />
                          SIP Investment Growth
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.slice(0, 10)}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="year" />
                              <YAxis 
                                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                              />
                              <RechartsTooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={(year) => `Year ${year}`}
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: 'none',
                                  borderRadius: '12px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                }}
                              />
                              <Legend />
                              {scenarios.map((scenario) => (
                                <Bar
                                  key={`sip_${scenario.id}`}
                                  dataKey={`sip_${scenario.id}`}
                                  fill={scenario.color}
                                  name={`${scenario.name} SIP Value`}
                                  radius={[4, 4, 0, 0]}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Detailed Tables */}
              <div className="grid lg:grid-cols-2 gap-8 mt-12">
                {/* Amortization Table */}
                <Collapsible open={showAmortization} onOpenChange={setShowAmortization}>
                  <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-3xl">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calculator className="h-6 w-6 text-financial-500" />
                            Loan Amortization Schedule
                          </div>
                          {showAmortization ? <ChevronUp /> : <ChevronDown />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="max-h-96 overflow-auto">
                        <div className="space-y-2">
                          <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
                            <span>Month</span>
                            <span>EMI</span>
                            <span>Principal</span>
                            <span>Interest</span>
                            <span>Balance</span>
                          </div>
                          {generateAmortizationSchedule(currentScenario!.loan).slice(0, 60).map((entry) => (
                            <div key={entry.month} className="grid grid-cols-5 gap-2 text-xs py-1 hover:bg-muted/30 rounded">
                              <span>{entry.month}</span>
                              <span>{formatCurrency(entry.emi)}</span>
                              <span className="text-green-600">{formatCurrency(entry.principal)}</span>
                              <span className="text-red-600">{formatCurrency(entry.interest)}</span>
                              <span>{formatCurrency(entry.balance)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* SIP Growth Table */}
                <Collapsible open={showSIPGrowth} onOpenChange={setShowSIPGrowth}>
                  <Card className="neumorph-outset rounded-3xl border-0 bg-card/50 backdrop-blur-sm">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-3xl">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-financial-500" />
                            SIP Growth Schedule
                          </div>
                          {showSIPGrowth ? <ChevronUp /> : <ChevronDown />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="max-h-96 overflow-auto">
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
                            <span>Month</span>
                            <span>Investment</span>
                            <span>Returns</span>
                            <span>Total Value</span>
                          </div>
                          {generateSIPGrowthSchedule(currentScenario!.sip).slice(0, 60).map((entry) => (
                            <div key={entry.month} className="grid grid-cols-4 gap-2 text-xs py-1 hover:bg-muted/30 rounded">
                              <span>{entry.month}</span>
                              <span>{formatCurrency(entry.investment)}</span>
                              <span className="text-green-600">{formatCurrency(entry.returns)}</span>
                              <span className="font-medium">{formatCurrency(entry.balance)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
