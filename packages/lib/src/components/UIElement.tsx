import { h } from 'preact';
import BaseElement from './BaseElement';
import { PaymentAction } from '../types';
import getImage from '../utils/get-image';
import PayButton from './internal/PayButton';
import { UIElementProps } from './types';
import { getSanitizedResponse } from './utils';
import AdyenCheckoutError from '../core/Errors/AdyenCheckoutError';

export class UIElement<P extends UIElementProps = any> extends BaseElement<P> {
    protected componentRef: any;
    public elementRef: any;

    constructor(props: P) {
        super(props);
        this.submit = this.submit.bind(this);
        this.setState = this.setState.bind(this);
        this.onValid = this.onValid.bind(this);
        this.onComplete = this.onComplete.bind(this);
        this.handleAction = this.handleAction.bind(this);
        this.handleOrder = this.handleOrder.bind(this);
        this.handleResponse = this.handleResponse.bind(this);
        this.elementRef = (props && props.elementRef) || this;
    }

    setState(newState: object): void {
        this.state = { ...this.state, ...newState };
        this.onChange();
    }

    onChange(): object {
        const isValid = this.isValid;
        const state = { data: this.data, errors: this.state.errors, valid: this.state.valid, isValid };
        if (this.props.onChange) this.props.onChange(state, this.elementRef);
        if (isValid) this.onValid();

        return state;
    }

    onValid() {
        const state = { data: this.data };
        if (this.props.onValid) this.props.onValid(state, this.elementRef);
        return state;
    }

    /**
     * Payment initiation handler. Used when a payment method needs to perform a step as soon as the Pay button is clicked.
     */
    startPayment(): Promise<any> {
        return Promise.resolve(true);
    }

    /**
     * Submit payment method data. If the form is not valid, it will trigger validation.
     */
    submit(): void {
        const { onError = () => {}, onSubmit, session } = this.props;
        this.startPayment()
            .then(() => {
                if (!this.isValid) {
                    this.showValidation();
                    return false;
                }

                // Classic flow
                if (onSubmit) return onSubmit({ data: this.data, isValid: this.isValid }, this.elementRef);

                // Session flow
                if (session) return this.submitPayment(this.data);

                return onError('Could not submit the payment');
            })
            .catch(error => onError(error));
    }

    onComplete(state): void {
        if (this.props.onComplete) this.props.onComplete(state, this.elementRef);
    }

    showValidation(): this {
        if (this.componentRef && this.componentRef.showValidation) this.componentRef.showValidation();
        return this;
    }

    setStatus(status): this {
        if (this.componentRef && this.componentRef.setStatus) this.componentRef.setStatus(status);
        return this;
    }

    submitPayment(data) {
        this.setStatus('loading');

        return this._parentInstance.session
            .submitPayment(data)
            .then(this.handleResponse)
            .catch(error => {
                this.setStatus('ready');
                this.handleError(error);
            });
    }

    submitAdditionalDetails(data): Promise<void> {
        return this._parentInstance.session
            .submitDetails(data)
            .then(this.handleResponse)
            .catch(error => {
                this.handleError(error);
            });
    }

    handleAction(action: PaymentAction, props = {}): UIElement {
        if (!action || !action.type) throw new Error('Invalid Action');

        const paymentAction = this._parentInstance.createFromAction(action, {
            ...props,
            onAdditionalDetails: this.handleAdditionalDetails
        });

        if (paymentAction) {
            this.unmount();
            return paymentAction.mount(this._node);
        }

        return null;
    }

    handleOrder(order) {
        // TODO handleOrder
        console.log(order);
    }

    handleResponse(rawResponse): void {
        const response = getSanitizedResponse(rawResponse);

        if (response.action) {
            this.handleAction(response.action);
        } else if (response.order?.remainingAmount?.value > 0) {
            this.handleOrder(response.order);
        } else {
            this.handleFinalResult(response);
        }
    }

    handleError = (error: AdyenCheckoutError): void => {
        if (this.props.onError) this.props.onError(error, this);
    };

    protected handleAdditionalDetails = state => {
        if (this.props.onAdditionalDetails) this.props.onAdditionalDetails(state, this.elementRef);
        if (this.props.session) this.submitAdditionalDetails(state.data);
        return state;
    };

    protected handleFinalResult = result => {
        if (this.props.onPaymentCompleted) this.props.onPaymentCompleted(result, this.elementRef);
        return result;
    };

    /**
     * Get the current validation status of the element
     */
    get isValid(): boolean {
        return false;
    }

    /**
     * Get the element icon URL for the current environment
     */
    get icon(): string {
        return this.props.icon ?? getImage({ loadingContext: this.props.loadingContext })(this.constructor['type']);
    }

    /**
     * Get the element's displayable name
     */
    get displayName(): string {
        return this.props.name || this.constructor['type'];
    }

    /**
     * Get the payButton component for the current element
     */
    public payButton = props => {
        return <PayButton {...props} amount={this.props.amount} onClick={this.submit} />;
    };
}

export default UIElement;
