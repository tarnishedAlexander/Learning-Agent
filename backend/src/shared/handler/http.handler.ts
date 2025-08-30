import { httpDTO } from "../interfaces/http.interface";


export const responseSuccess = (correlation_id: string, data: any, description: string, path: string): httpDTO => {
    return {
        code: 200,
        error: '',
        correlation_id,
        data,
        description,
        path
    }
}

export const responseCreated = (correlation_id: string, data: any, description: string, path: string): httpDTO => {
    return {
        code: 201,
        error: '',
        correlation_id,
        data,
        description,
        path
    }
}

export const responseBadRequest = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 400,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}

export const responseUnauthorized = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 401,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}

export const responseForbidden = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 403,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}

export const responseNotFound = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 404,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}


export const responseAlreadyCreated = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 409,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}

export const responseConflict = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 409,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}

export const responseTooManyRequest = (errorMsg: string, correlation_id: string, description: string, path: string): httpDTO => {
    return {
        code: 429,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}

export const responseInternalServerError = (errorMsg: string, correlation_id: string, description: string, path: string) => {
    return {
        code: 500,
        error: errorMsg,
        correlation_id,
        data: [],
        description,
        path
    }
}