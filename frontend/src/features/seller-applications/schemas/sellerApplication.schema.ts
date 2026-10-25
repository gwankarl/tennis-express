import { z } from 'zod'

const regions = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West',
] as const

const sourcingMethods = [
  'manufacturer',
  'authorized_distributor',
  'wholesaler',
  'local_supplier',
  'other',
] as const

const fulfilmentMethods = ['delivery', 'collection'] as const

const acceptedDeclaration = (message: string) =>
  z
    .boolean()
    .refine((accepted) => accepted, message)
    .transform(() => true as const)

const nullableText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null)

export const sellerApplicationSchema = z
  .object({
    businessDetails: z
      .object({
        sellerType: z.enum(['individual', 'business']),
        businessName: nullableText(150),
        storeName: nullableText(100),
        businessRegistrationNumber: nullableText(100),
      })
      .superRefine((details, context) => {
        if (details.sellerType === 'business' && !details.businessName) {
          context.addIssue({
            code: 'custom',
            path: ['businessName'],
            message: 'Business sellers must provide a business name.',
          })
        }

        if (details.sellerType === 'individual' && !details.storeName) {
          context.addIssue({
            code: 'custom',
            path: ['storeName'],
            message: 'Individual sellers must provide a store name.',
          })
        }
      }),

    contactDetails: z.object({
      region: z.enum(regions),
      city: z.string().trim().min(1, 'City or town is required.').max(100),
      address: z.string().trim().min(1, 'Operating address is required.').max(300),
      phoneNumber: z
        .string()
        .trim()
        .min(7, 'Enter a valid contact phone number.')
        .max(25)
        .regex(/^[+\d][\d\s()-]*$/, 'Enter a valid contact phone number.'),
    }),

    productDetails: z
      .object({
        businessDescription: z
          .string()
          .trim()
          .min(20, 'Describe your business in at least 20 characters.')
          .max(2000),
        sourcingMethods: z.array(z.enum(sourcingMethods)).min(1).max(5),
        otherSourcingMethod: nullableText(200),
      })
      .superRefine((details, context) => {
        if (details.sourcingMethods.includes('other') && !details.otherSourcingMethod) {
          context.addIssue({
            code: 'custom',
            path: ['otherSourcingMethod'],
            message: 'Describe the other sourcing method.',
          })
        }

        if (!details.sourcingMethods.includes('other') && details.otherSourcingMethod !== null) {
          context.addIssue({
            code: 'custom',
            path: ['otherSourcingMethod'],
            message: 'Only provide this field when selecting other.',
          })
        }
      }),

    fulfilmentDetails: z.object({
      methods: z.array(z.enum(fulfilmentMethods)).min(1).max(2),
      serviceRegions: z.array(z.enum(regions)).min(1).max(10),
      dispatchTime: z.enum([
        'same_day',
        'one_to_three_days',
        'four_to_seven_days',
        'over_seven_days',
      ]),
    }),

    declarations: z.object({
      informationIsAccurate: acceptedDeclaration(
        'Confirm that the submitted information is accurate.',
      ),
      sellerPolicyAccepted: acceptedDeclaration('Accept the seller policies.'),
      productsAreGenuineAndLegallySellable: acceptedDeclaration(
        'Confirm your products are genuine and legally sellable.',
      ),
    }),
  })
  .strict()

export type SellerApplicationFormValues = z.input<typeof sellerApplicationSchema>
export type SellerApplicationRequest = z.output<typeof sellerApplicationSchema>
