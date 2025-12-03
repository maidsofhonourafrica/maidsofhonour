import axios from 'axios';

const SASAPAY_BASE_URL = process.env.SASAPAY_BASE_URL || 'https://sandbox.sasapay.app/api/v1';
const MERCHANT_CODE = '600980'; // From your environment or config

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PaymentRequestParams {
  networkCode: string;
  phoneNumber: string;
  amount: string;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
  transactionFee?: string;
}

interface PaymentRequestResponse {
  status: boolean;
  detail: string;
  PaymentGateway: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  TransactionReference: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface ProcessPaymentParams {
  checkoutRequestId: string;
  verificationCode: string;
}

interface ProcessPaymentResponse {
  status: boolean;
  detail: string;
}

interface TransactionStatusResponse {
  status: boolean;
  detail: string;
  ResultCode?: string;
  ResultDesc?: string;
  TransAmount?: string;
  TransactionDate?: string;
  ThirdPartyTransID?: string;
}

export interface DisbursementParams {
  merchantTransactionReference: string;
  amount: string;
  receiverNumber: string;
  reason: string;
  callbackUrl: string;
  channel?: string; // Optional, defaults to 63902 (M-PESA)
}

export interface DisbursementResponse {
  status: boolean;
  detail: string;
  B2CRequestID: string;
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  TransactionCharges: string;
  ResponseDescription: string;
}

export class SasaPayService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Authenticate with SasaPay and get access token
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Create Basic Auth credentials
      const credentials = Buffer.from(
        `${process.env.SASAPAY_CLIENT_ID}:${process.env.SASAPAY_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.get<AuthResponse>(
        `${SASAPAY_BASE_URL}/auth/token/?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      const expirySeconds = response.data.expires_in - 300;
      this.tokenExpiry = new Date(Date.now() + expirySeconds * 1000);

      return this.accessToken;
    } catch (error: any) {
      console.error('SasaPay Authentication Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with SasaPay');
    }
  }

  /**
   * Request payment from customer (C2B)
   */
  async requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResponse> {
    const token = await this.authenticate();

    try {
      const response = await axios.post<PaymentRequestResponse>(
        `${SASAPAY_BASE_URL}/payments/request-payment/`,
        {
          MerchantCode: MERCHANT_CODE,
          NetworkCode: params.networkCode,
          Currency: 'KES',
          Amount: params.amount,
          CallBackURL: params.callbackUrl,
          PhoneNumber: params.phoneNumber,
          TransactionDesc: params.transactionDesc,
          AccountReference: params.accountReference,
          ...(params.transactionFee && { 'Transaction Fee': params.transactionFee }),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('SasaPay Payment Request Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to request payment');
    }
  }

  /**
   * Process payment with OTP (for SasaPay wallet payments)
   */
  async processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResponse> {
    const token = await this.authenticate();

    try {
      const response = await axios.post<ProcessPaymentResponse>(
        `${SASAPAY_BASE_URL}/payments/process-payment/`,
        {
          CheckoutRequestID: params.checkoutRequestId,
          MerchantCode: MERCHANT_CODE,
          VerificationCode: params.verificationCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('SasaPay Process Payment Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to process payment');
    }
  }

  /**
   * Disburse funds to customer (B2C)
   * Used for Escrow release and refunds
   */
  async disburseFunds(params: DisbursementParams): Promise<DisbursementResponse> {
    const token = await this.authenticate();

    try {
      const response = await axios.post<DisbursementResponse>(
        `${SASAPAY_BASE_URL}/payments/b2c/`,
        {
          MerchantCode: MERCHANT_CODE,
          MerchantTransactionReference: params.merchantTransactionReference,
          Amount: params.amount,
          Currency: 'KES',
          ReceiverNumber: params.receiverNumber,
          Channel: params.channel || process.env.SASAPAY_B2C_CHANNEL || '63902', // Default to M-PESA
          Reason: params.reason,
          CallBackURL: params.callbackUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('SasaPay Disbursement Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to disburse funds');
    }
  }

  /**
   * Query transaction status
   */
  async queryTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResponse> {
    const token = await this.authenticate();

    try {
      const response = await axios.post<TransactionStatusResponse>(
        `${SASAPAY_BASE_URL}/payments/query-payment-status/`,
        {
          CheckoutRequestID: checkoutRequestId,
          MerchantCode: MERCHANT_CODE,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('SasaPay Query Status Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Failed to query transaction status');
    }
  }
}

export const sasaPayService = new SasaPayService();
