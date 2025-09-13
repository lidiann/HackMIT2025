class EnergyCalculator {
  constructor() {
    // Claude's Environmental Multipliers
    this.PUE = 1.4; // Power Usage Effectiveness (kW)
    this.WUE_ONSITE = 0.18; // Water Usage Effectiveness - on-site (liters/kWh)
    this.WUE_OFFSITE = 3.142; // Water Usage Effectiveness - off-site (liters/kWh)
    this.CIF = 0.385; // Carbon Intensity Factor (kgCO2e/kWh)
    
    // Hardware specifications - Claude uses DGX H200/H100
    // Based on NVIDIA DGX H200/H100 specifications
    this.P_GPU = 700; // H100 GPU power consumption (W) - NVIDIA spec
    this.P_NON_GPU = 200; // Non-GPU power consumption (W) - CPU, memory, etc.
    
    // Claude model class - assuming Large class for Sonnet 4
    // Based on Table 2: Estimated node-level GPU and non-GPU utilization
    this.MODEL_CLASS = 'Large'; // Nano, Micro, Small, Medium, Large
    this.GPU_COUNT = 8; // Large class uses 8 GPUs
    this.U_GPU = 0.06; // 6% total GPU utilization for Large class H100
    this.U_NON_GPU = 0.0625; // 6.25% non-GPU utilization for Large class
    
    // Performance metrics (ESTIMATED - needs real Claude data)
    this.TPS = 30; // Tokens per second (estimated for Claude)
    this.LATENCY = 0.8; // Latency in seconds (estimated)
    
    // Model class configurations based on research data
    this.MODEL_CLASSES = {
      'Nano': { gpuCount: 1, uGpu: 0.01, uNonGpu: 0.0087 },
      'Micro': { gpuCount: 1, uGpu: 0.0125, uNonGpu: 0.0087 },
      'Small': { gpuCount: 2, uGpu: 0.025, uNonGpu: 0.016 },
      'Medium': { gpuCount: 4, uGpu: 0.045, uNonGpu: 0.03125 },
      'Large': { gpuCount: 8, uGpu: 0.06, uNonGpu: 0.0625 }
    };
  }

  /**
   * Calculate energy consumption per query using the formula:
   * E_query (kWh) = (Total inference time (hours)) ⋅ (Total power (W)) ⋅ PUE
   */
  calculateEnergyPerQuery(outputLength) {
    // Calculate total inference time in hours
    const totalInferenceTimeHours = this.calculateInferenceTime(outputLength);
    
    // Calculate total power consumption
    const totalPowerWatts = this.calculateTotalPower();
    
    // Convert power from Watts to kW
    const totalPowerKW = totalPowerWatts / 1000;
    
    // Apply PUE multiplier
    const energyPerQuery = totalInferenceTimeHours * totalPowerKW * this.PUE;
    
    return {
      energy: energyPerQuery,
      inferenceTime: totalInferenceTimeHours,
      totalPower: totalPowerWatts,
      breakdown: {
        gpuPower: this.P_GPU * this.GPU_COUNT * this.U_GPU,
        nonGpuPower: this.P_NON_GPU * this.U_NON_GPU,
        totalPower: totalPowerWatts,
        pue: this.PUE,
        gpuCount: this.GPU_COUNT,
        modelClass: this.MODEL_CLASS
      }
    };
  }

  /**
   * Calculate inference time based on output length and throughput
   * Total inference time (hours) = (Output Length / TPS + Latency) / 3600
   */
  calculateInferenceTime(outputLength) {
    const inferenceTimeSeconds = (outputLength / this.TPS) + this.LATENCY;
    return inferenceTimeSeconds / 3600; // Convert to hours
  }

  /**
   * Calculate total power consumption
   * Total power (W) = (P_GPU × GPU_COUNT × U_GPU) + (P_non-GPU × U_non-GPU)
   */
  calculateTotalPower() {
    const gpuPower = this.P_GPU * this.GPU_COUNT * this.U_GPU;
    const nonGpuPower = this.P_NON_GPU * this.U_NON_GPU;
    return gpuPower + nonGpuPower;
  }

  /**
   * Calculate water usage using the formula:
   * Water (L) = (E_query / PUE) * WUE_site + E_query * WUE_source
   */
  calculateWaterUsage(energyQuery) {
    const onsiteWater = (energyQuery / this.PUE) * this.WUE_ONSITE;
    const offsiteWater = energyQuery * this.WUE_OFFSITE;
    const totalWater = onsiteWater + offsiteWater;
    
    return {
      total: totalWater,
      onsite: onsiteWater,
      offsite: offsiteWater,
      breakdown: {
        onsiteWUE: this.WUE_ONSITE,
        offsiteWUE: this.WUE_OFFSITE,
        pue: this.PUE
      }
    };
  }

  /**
   * Calculate carbon emissions using the formula:
   * Carbon (kgCO2e) = E_query * CIF
   */
  calculateCarbonEmissions(energyQuery) {
    const carbonEmissions = energyQuery * this.CIF;
    
    return {
      total: carbonEmissions,
      cif: this.CIF,
      energy: energyQuery
    };
  }

  /**
   * Calculate comprehensive environmental impact for a given token count
   */
  calculateEnvironmentalImpact(tokenCount) {
    const energyData = this.calculateEnergyPerQuery(tokenCount);
    const waterData = this.calculateWaterUsage(energyData.energy);
    const carbonData = this.calculateCarbonEmissions(energyData.energy);
    
    return {
      tokens: tokenCount,
      energy: {
        total: energyData.energy,
        inferenceTime: energyData.inferenceTime,
        powerBreakdown: energyData.breakdown
      },
      water: {
        total: waterData.total,
        onsite: waterData.onsite,
        offsite: waterData.offsite,
        breakdown: waterData.breakdown
      },
      carbon: {
        total: carbonData.total,
        cif: carbonData.cif
      },
      multipliers: {
        pue: this.PUE,
        wueOnsite: this.WUE_ONSITE,
        wueOffsite: this.WUE_OFFSITE,
        cif: this.CIF
      }
    };
  }

  /**
   * Calculate environmental impact for multiple queries (cumulative)
   */
  calculateCumulativeImpact(queries) {
    let totalEnergy = 0;
    let totalWater = 0;
    let totalCarbon = 0;
    let totalTokens = 0;
    
    const impacts = queries.map(query => {
      const impact = this.calculateEnvironmentalImpact(query.tokens);
      totalEnergy += impact.energy.total;
      totalWater += impact.water.total;
      totalCarbon += impact.carbon.total;
      totalTokens += impact.tokens;
      
      return impact;
    });
    
    return {
      totalTokens,
      totalEnergy,
      totalWater,
      totalCarbon,
      averagePerToken: {
        energy: totalEnergy / totalTokens,
        water: totalWater / totalTokens,
        carbon: totalCarbon / totalTokens
      },
      queries: impacts
    };
  }

  /**
   * Format environmental impact for display
   */
  formatImpact(impact) {
    return {
      tokens: impact.tokens.toLocaleString(),
      energy: `${impact.energy.total.toFixed(6)} kWh`,
      water: `${impact.water.total.toFixed(3)} L`,
      carbon: `${impact.carbon.total.toFixed(6)} kg CO₂e`,
      inferenceTime: `${(impact.energy.inferenceTime * 3600).toFixed(2)}s`
    };
  }

  /**
   * Get environmental multipliers for display
   */
  getMultipliers() {
    return {
      pue: this.PUE,
      wueOnsite: this.WUE_ONSITE,
      wueOffsite: this.WUE_OFFSITE,
      cif: this.CIF,
      gpuPower: this.P_GPU,
      gpuUtilization: this.U_GPU,
      nonGpuPower: this.P_NON_GPU,
      nonGpuUtilization: this.U_NON_GPU,
      tokensPerSecond: this.TPS,
      latency: this.LATENCY
    };
  }

  /**
   * Update hardware specifications (for different model configurations)
   */
  updateHardwareSpecs(specs) {
    if (specs.pGpu !== undefined) this.P_GPU = specs.pGpu;
    if (specs.uGpu !== undefined) this.U_GPU = specs.uGpu;
    if (specs.pNonGpu !== undefined) this.P_NON_GPU = specs.pNonGpu;
    if (specs.uNonGpu !== undefined) this.U_NON_GPU = specs.uNonGpu;
    if (specs.tps !== undefined) this.TPS = specs.tps;
    if (specs.latency !== undefined) this.LATENCY = specs.latency;
  }

  /**
   * Set model class (Nano, Micro, Small, Medium, Large)
   * Updates GPU count and utilization based on research data
   */
  setModelClass(modelClass) {
    if (this.MODEL_CLASSES[modelClass]) {
      this.MODEL_CLASS = modelClass;
      this.GPU_COUNT = this.MODEL_CLASSES[modelClass].gpuCount;
      this.U_GPU = this.MODEL_CLASSES[modelClass].uGpu;
      this.U_NON_GPU = this.MODEL_CLASSES[modelClass].uNonGpu;
      console.log(`Updated to ${modelClass} class: ${this.GPU_COUNT} GPUs, ${(this.U_GPU * 100).toFixed(2)}% GPU util, ${(this.U_NON_GPU * 100).toFixed(2)}% non-GPU util`);
    } else {
      console.error(`Unknown model class: ${modelClass}. Available: ${Object.keys(this.MODEL_CLASSES).join(', ')}`);
    }
  }

  /**
   * Update environmental multipliers (for different regions/data centers)
   */
  updateEnvironmentalMultipliers(multipliers) {
    if (multipliers.pue !== undefined) this.PUE = multipliers.pue;
    if (multipliers.wueOnsite !== undefined) this.WUE_ONSITE = multipliers.wueOnsite;
    if (multipliers.wueOffsite !== undefined) this.WUE_OFFSITE = multipliers.wueOffsite;
    if (multipliers.cif !== undefined) this.CIF = multipliers.cif;
  }

  /**
   * Update with real Claude performance data
   * Call this when you get actual measurements from Anthropic
   */
  updateWithRealClaudeData(data) {
    console.log('Updating with real Claude data:', data);
    
    if (data.tokensPerSecond !== undefined) {
      this.TPS = data.tokensPerSecond;
      console.log(`Updated TPS to: ${this.TPS}`);
    }
    
    if (data.latency !== undefined) {
      this.LATENCY = data.latency;
      console.log(`Updated latency to: ${this.LATENCY}s`);
    }
    
    if (data.gpuPower !== undefined) {
      this.P_GPU = data.gpuPower;
      console.log(`Updated GPU power to: ${this.P_GPU}W`);
    }
    
    if (data.gpuUtilization !== undefined) {
      this.U_GPU = data.gpuUtilization;
      console.log(`Updated GPU utilization to: ${this.U_GPU}`);
    }
    
    if (data.nonGpuPower !== undefined) {
      this.P_NON_GPU = data.nonGpuPower;
      console.log(`Updated non-GPU power to: ${this.P_NON_GPU}W`);
    }
    
    if (data.nonGpuUtilization !== undefined) {
      this.U_NON_GPU = data.nonGpuUtilization;
      console.log(`Updated non-GPU utilization to: ${this.U_NON_GPU}`);
    }
  }

  /**
   * Get current estimates with warnings
   */
  getCurrentEstimates() {
    return {
      warning: "⚠️ These are ESTIMATED values - replace with real Claude data",
      hardware: {
        gpuPower: this.P_GPU,
        gpuUtilization: this.U_GPU,
        nonGpuPower: this.P_NON_GPU,
        nonGpuUtilization: this.U_NON_GPU
      },
      performance: {
        tokensPerSecond: this.TPS,
        latency: this.LATENCY
      },
      environmental: {
        pue: this.PUE,
        wueOnsite: this.WUE_ONSITE,
        wueOffsite: this.WUE_OFFSITE,
        cif: this.CIF
      },
      needsRealData: [
        "Claude Sonnet 4 tokens per second",
        "Claude inference latency",
        "Actual hardware power consumption",
        "GPU utilization rates",
        "Non-GPU power consumption"
      ]
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnergyCalculator;
} else if (typeof window !== 'undefined') {
  window.EnergyCalculator = EnergyCalculator;
}
