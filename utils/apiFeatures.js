class APIFeatures {
  constructor(modelQuery, queryString) {
    //query do mongoose
    this.modelQuery = modelQuery;
    //separando tds parametros que não são atributos de filtro
    ({
      page: this.page,
      sort: this.sort,
      limit: this.limit,
      fields: this.fields,
      ...this.queryString
    } = queryString);
  }

  filter() {
    //convertendo pra string e adicionando $ antes dos operadores
    this.queryString = JSON.stringify(this.queryString).replace(
      /\b(gte?|lte?)\b/g,
      (match) => `$${match}`
    );
    //adicionando filter na query, sem executar
    this.modelQuery = this.modelQuery.find(JSON.parse(this.queryString));
    //retornando classe pra poder continuar a chain
    return this;
  }

  sorter() {
    if (this.sort) {
      //separando os sort que vem assim "1,2" por espaço no lugar da vírgula
      this.sort = this.sort.split(',').join(' ');
      //adicionando filter na query, sem executar
      this.modelQuery = this.modelQuery.sort(this.sort);
    }
    //retornando classe pra poder continuar a chain
    return this;
  }

  limiter() {
    if (this.fields) {
      this.fields = this.fields.split(',').join(' ');
      this.modelQuery = this.modelQuery.select(this.fields);
    } else {
      this.modelQuery = this.modelQuery.select('-__v');
    }
    return this;
  }

  paginator() {
    this.page = this.page * 1 || 1;
    this.limit = this.limit * 1 || 10;
    const skip = (this.page - 1) * this.limit;
    this.modelQuery.skip(skip).limit(this.limit);

    return this;
  }
}

module.exports = APIFeatures;
