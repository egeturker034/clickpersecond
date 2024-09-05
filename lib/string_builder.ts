export class StringBuilder {
  private value: string;

  constructor(initialValue: string = '') {
    this.value = initialValue;
  }

  append(str: string): StringBuilder {
    this.value += str;
    return this;
  }

  toString(): string {
    return this.value;
  }

  appendLine(str: string): StringBuilder {
    this.value += str + '\n';
    return this;
  } 
}

  
  
