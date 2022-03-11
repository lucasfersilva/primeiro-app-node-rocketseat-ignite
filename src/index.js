const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid') 

const customers = []

app.use(express.json())
//Middleware functions
function verifyIfExistsCPF(request, response,next){
    const{cpf} = request.headers
    const customer = customers.find(customer => customer.cpf === cpf)
    if (!customer){
        return response.status(400).json("Customer not found")
    }
    request.customer = customer;
    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc,operation) => {
        if(operation.type === "Credit"){
            return acc + operation.amount
        }else{
            return acc - operation.amount
        }

    }, 0)
    return balance
}


app.post("/account",(request, response) => {
    const {cpf,name} = request.body;
    const customerAlreadyExists = customers.some(
    (customer) => customer.cpf ===cpf)
    if (customerAlreadyExists){
        return response.status(400).json({error: 'Customer already exists'})
    }
     

    customers.push({
        cpf,
        name,
        id:uuidv4(),
        statement:[]
    })

    return response.status(201).send()
})

//app.use(verifyIfExistsCPF);

app.get("/statement",verifyIfExistsCPF,(request,response) => {
    const {customer} = request
    return response.json(customer.statement)
})

app.post('/deposit', verifyIfExistsCPF, (request, response)=> {
    const{description,amount} = request.body;

    const{customer} = request;

    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type:'Credit'
    }
    customer.statement.push(statementOperation);

    return response.status(201).send();
})

app.post('/withdraw',verifyIfExistsCPF, (request, response)=> {
    const {amount} = request.body;
    const {customer} = request;

    const balance = getBalance(customer.statement);

    if(amount> balance) {
        return response.status(400).json({error: 'insufficient funds'})
    }

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type:'debit'
    }
    customer.statement.push(statementOperation);
    return response.status(201).send();

})

app.get("/statement/:date",verifyIfExistsCPF,(request,response) => {
    const {customer} = request
    const {date} = request.query;

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter(
        (statement) => statement.createdAt.toDateString()===
    new Date(dateFormat).toDateString())

    return response.json(statement)
})

app.put("/account",verifyIfExistsCPF,(request,response) =>{
    const {name} = request.body;
    const {customer} = request;

    customer.name = name;

    return response.status(201).send()
})

app.get("/account",verifyIfExistsCPF,(request, response) =>{
    const {customer} = request
    return response.json(customer)
})

app.delete("/account",verifyIfExistsCPF,(request,response) =>{
    const {customer} = request
    customers.splice(customer, 1)



    return response.status(200).json(customers)
})


app.get("/balance", verifyIfExistsCPF,(request, response) =>{
    const {customer} = request
    balance = getBalance(customer.statement)

    return response.json(balance);
}

)


app.listen(3333);