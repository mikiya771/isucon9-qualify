import AppClient from '../httpClients/appClient';
import PaymentClient from '../httpClients/paymentClient';
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { FormErrorState } from "../reducers/formErrorReducer";
import { push } from 'connected-react-router';
import {AnyAction} from "redux";
import {BuyReq} from "../types/appApiTypes";
import {routes} from "../routes/Route";
import {CardReq, CardRes} from "../types/paymentApiTypes";
import {PaymentResponseError} from "../errors/PaymentResponseError";
import {AppResponseError} from "../errors/AppResponseError";
import {ResponseError} from "../errors/ResponseError";

export const BUY_SUCCESS = 'BUY_SUCCESS';
export const BUY_FAIL = 'BUY_FAIL';
export const USING_CARD_FAIL = 'USING_CARD_FAIL';

type State = void;
type ThunkResult<R> = ThunkAction<R, State, undefined, AnyAction>

export function buyItemAction(itemId: number, cardNumber: string): ThunkResult<void> {
    return (dispatch: ThunkDispatch<any, any, AnyAction>) => {
        PaymentClient.post('/card', {
            card_number: cardNumber,
            shop_id: 'TODO',
        } as CardReq)
            .then((response: Response) => {
                if (!response.ok) {
                    throw new PaymentResponseError(
                        'request to /card of payment service was failed', response
                    );
                }

                return response.json();
            })
            .then((body: CardRes) => {
                return AppClient.post('/buy', {
                    item_id: itemId,
                    token: body.token,
                } as BuyReq);
            })
            .then((response: Response) => {
                if (!response.ok) {
                    throw new AppResponseError(
                        'request to /buy of app was failed', response
                    );
                }

                return response.json();
            })
            .then((body: {}) => {
                dispatch(buySuccessAction());
                dispatch(push(routes.buyComplete.path));
            })
            .catch((err: Error) => {
                if (err instanceof ResponseError) {
                    return err.getResponse().json();
                }

                dispatch(buyFailAction(err.message));
            })
            .then((body) => {
                dispatch(usingCardFailAction(body.error)); // TODO cardエラーかappエラーか区別する
            });
    };
}

export interface BuySuccessAction {
    type: typeof BUY_SUCCESS,
}

export function buySuccessAction(): BuySuccessAction {
    return {
        type: BUY_SUCCESS,
    };
}

export interface UsingCardFailAction {
    type: typeof USING_CARD_FAIL,
    payload: FormErrorState,
}

export function usingCardFailAction(error: string): UsingCardFailAction{
    return {
        type: USING_CARD_FAIL,
        payload: {
            error: undefined,
            buyFormError: {
                cardError: error,
            },
        },
    };
}
export interface BuyFailAction {
    type: typeof BUY_FAIL,
    payload: FormErrorState,
}

export function buyFailAction(error: string): BuyFailAction {
    return {
        type: BUY_FAIL,
        payload: {
            error: undefined,
            buyFormError: {
                buyError: error,
            },
        },
    };
}
