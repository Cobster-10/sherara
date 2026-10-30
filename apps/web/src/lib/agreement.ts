import { hashTypedData, verifyTypedData, type Address, type Hex } from 'viem';

export type AgreementInput = {
  id: Hex; customer: Address; merchant: Address; chainId: number;
  token: Address; recipient: Address; amount: string; deadline: number;
};

export const types = {
  Agreement: [
    { name: 'id', type: 'bytes32' },
    { name: 'customer', type: 'address' },
    { name: 'merchant', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
} as const;

export function typedAgreement(value: AgreementInput) {
  return {
    domain: { name: 'Sherara', version: '0.1', chainId: value.chainId },
    types,
    primaryType: 'Agreement' as const,
    message: {
      id: value.id, customer: value.customer, merchant: value.merchant,
      token: value.token, recipient: value.recipient,
      amount: BigInt(value.amount), deadline: BigInt(value.deadline)
    }
  };
}

export async function checkAgreement(value: AgreementInput, customerSignature: Hex, merchantSignature?: Hex) {
  const typed = typedAgreement(value);
  const customerValid = await verifyTypedData({ ...typed, address: value.customer, signature: customerSignature });
  const merchantValid = merchantSignature ? await verifyTypedData({ ...typed, address: value.merchant, signature: merchantSignature }) : false;
  return { digest: hashTypedData(typed), customerValid, merchantValid };
}
