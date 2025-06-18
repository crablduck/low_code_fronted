declare module 'vue-form-generator' {
  import { Component } from 'vue'
  
  interface Validators {
    string: (value: string, field: any, model: any) => boolean | string
    number: (value: number, field: any, model: any) => boolean | string
    email: (value: string, field: any, model: any) => boolean | string
    required: (value: any, field: any, model: any) => boolean | string
  }

  interface VueFormGenerator {
    component: Component
    validators: Validators
  }

  const VueFormGenerator: VueFormGenerator
  export default VueFormGenerator
} 