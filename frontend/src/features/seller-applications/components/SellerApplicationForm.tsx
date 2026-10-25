import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { Notification } from '../../../components/feedback/Notification'
import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { getApiError } from '../../../lib/apiError'
import {
  sellerApplicationSchema,
  type SellerApplicationFormValues,
  type SellerApplicationRequest,
} from '../schemas/sellerApplication.schema'
import { useSaveSellerApplication } from '../hooks/useSellerApplications'
import type { SellerApplication, SellerApplicationDocumentType } from '../types'

interface SellerApplicationFormProps {
  rejectedApplication?: SellerApplication
  onCancel: () => void
  onSuccess: () => void
}

interface SelectedDocument {
  file: File
  documentType: SellerApplicationDocumentType
}

const maxFileSize = 5 * 1024 * 1024
const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png']

const defaultValues: SellerApplicationFormValues = {
  businessDetails: {
    sellerType: 'individual',
    businessName: '',
    storeName: '',
    businessRegistrationNumber: '',
  },
  contactDetails: {
    region: 'Centre',
    city: '',
    address: '',
    phoneNumber: '',
  },
  productDetails: {
    businessDescription: '',
    sourcingMethods: [],
    otherSourcingMethod: '',
  },
  fulfilmentDetails: {
    methods: [],
    serviceRegions: [],
    dispatchTime: 'one_to_three_days',
  },
  declarations: {
    informationIsAccurate: false,
    sellerPolicyAccepted: false,
    productsAreGenuineAndLegallySellable: false,
  },
}

export function SellerApplicationForm({
  rejectedApplication,
  onCancel,
  onSuccess,
}: SellerApplicationFormProps) {
  const [documents, setDocuments] = useState<SelectedDocument[]>([])
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const saveApplication = useSaveSellerApplication()

  const initialData = rejectedApplication?.applicationData

  const parsedInitialData = initialData
    ? sellerApplicationSchema.safeParse({
        ...initialData,
        declarations: {
          informationIsAccurate: true,
          sellerPolicyAccepted: true,
          productsAreGenuineAndLegallySellable: true,
        },
      })
    : null

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SellerApplicationFormValues, unknown, SellerApplicationRequest>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: parsedInitialData?.success
      ? {
          ...parsedInitialData.data,
          businessDetails: {
            ...parsedInitialData.data.businessDetails,
            businessName: parsedInitialData.data.businessDetails.businessName ?? '',
            storeName: parsedInitialData.data.businessDetails.storeName ?? '',
            businessRegistrationNumber:
              parsedInitialData.data.businessDetails.businessRegistrationNumber ?? '',
          },
          productDetails: {
            ...parsedInitialData.data.productDetails,
            otherSourcingMethod: parsedInitialData.data.productDetails.otherSourcingMethod ?? '',
          },
        }
      : defaultValues,
  })

  const sellerType = useWatch({
    control,
    name: 'businessDetails.sellerType',
  })

  const sourcingSelection = useWatch({
    control,
    name: 'productDetails.sourcingMethods',
  })
  const busy = saveApplication.isPending

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const nextDocuments = [...documents]
    for (const file of Array.from(fileList)) {
      if (nextDocuments.length >= 5) {
        setNotice({
          title: 'Too many documents',
          message: 'You can attach up to five documents.',
        })
        break
      }

      if (file.size > maxFileSize || !acceptedTypes.includes(file.type)) {
        setNotice({
          title: 'Invalid document',
          message: 'Choose PDF, JPEG, or PNG files no larger than 5 MB each.',
        })
        continue
      }

      nextDocuments.push({ file, documentType: 'other' })
    }

    setDocuments(nextDocuments)
  }

  const onSubmit = async (applicationData: SellerApplicationRequest) => {
    setNotice(null)

    try {
      await saveApplication.mutateAsync({
        applicationData,
        documents,
        rejectedApplicationId: rejectedApplication?._id,
        onProgress: setUploadProgress,
      })
      onSuccess()
    } catch (error) {
      const apiError = getApiError(error)

      setNotice({
        title:
          apiError.code === 'SELLER_APPLICATION_ALREADY_PENDING'
            ? 'An application is already pending'
            : 'Application could not be submitted',
        message: apiError.message,
      })
    } finally {
      setUploadProgress(null)
    }
  }

  const setDocumentType = (index: number, value: SellerApplicationDocumentType) => {
    setDocuments((current) =>
      current.map((document, currentIndex) =>
        currentIndex === index ? { ...document, documentType: value } : document,
      ),
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-6" aria-busy={busy}>
      {notice && (
        <Notification
          tone="error"
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {rejectedApplication && (
        <Notification
          title="Resubmitting this application"
          message="The rejected application will remain in your history. If you attach new documents, they will replace the documents on the new submission. If you attach none, the existing documents will be carried forward."
        />
      )}

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-section-heading font-semibold">Business details</h2>

        <label className="grid gap-1.5 text-form-label font-medium">
          Seller type
          <select
            {...register('businessDetails.sellerType')}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-body"
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </label>

        {sellerType === 'business' && (
          <FormField
            {...register('businessDetails.businessName')}
            id="businessName"
            label="Business name"
            required
            error={errors.businessDetails?.businessName?.message}
          />
        )}

        <FormField
          {...register('businessDetails.storeName')}
          id="storeName"
          label="Store name"
          required={sellerType === 'individual'}
          error={errors.businessDetails?.storeName?.message}
        />
        <FormField
          {...register('businessDetails.businessRegistrationNumber')}
          id="businessRegistrationNumber"
          label="Business registration number"
          error={errors.businessDetails?.businessRegistrationNumber?.message}
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-section-heading font-semibold">Contact and location</h2>

        <label className="grid gap-1.5 text-form-label font-medium">
          Region
          <select
            {...register('contactDetails.region')}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-body"
          >
            {[
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
            ].map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <FormField
          {...register('contactDetails.city')}
          id="city"
          label="City or town"
          required
          error={errors.contactDetails?.city?.message}
        />
        <FormField
          {...register('contactDetails.address')}
          id="address"
          label="Operating address"
          required
          error={errors.contactDetails?.address?.message}
        />
        <FormField
          {...register('contactDetails.phoneNumber')}
          id="phoneNumber"
          label="Contact phone"
          type="tel"
          required
          error={errors.contactDetails?.phoneNumber?.message}
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-section-heading font-semibold">Products and fulfilment</h2>

        <label className="grid gap-1.5 text-form-label font-medium">
          Business description
          <textarea
            {...register('productDetails.businessDescription')}
            rows={5}
            className="rounded-md border border-border bg-surface p-3 text-body"
          />
          {errors.productDetails?.businessDescription?.message && (
            <span className="text-form-error text-error">
              {errors.productDetails.businessDescription.message}
            </span>
          )}
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-form-label font-medium">Product sourcing methods</legend>
          {[
            ['manufacturer', 'Manufacturer'],
            ['authorized_distributor', 'Authorized distributor'],
            ['wholesaler', 'Wholesaler'],
            ['local_supplier', 'Local supplier'],
            ['other', 'Other'],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-10 items-center gap-2 text-supporting">
              <input
                type="checkbox"
                value={value}
                {...register('productDetails.sourcingMethods')}
              />
              {label}
            </label>
          ))}
          {errors.productDetails?.sourcingMethods?.message && (
            <span className="text-form-error text-error">
              {errors.productDetails.sourcingMethods.message}
            </span>
          )}
        </fieldset>

        {sourcingSelection?.includes('other') && (
          <FormField
            {...register('productDetails.otherSourcingMethod')}
            id="otherSourcingMethod"
            label="Describe the other sourcing method"
            required
            error={errors.productDetails?.otherSourcingMethod?.message}
          />
        )}

        <fieldset className="grid gap-2">
          <legend className="text-form-label font-medium">Fulfilment methods</legend>
          {[
            ['delivery', 'Delivery'],
            ['collection', 'Collection'],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-10 items-center gap-2 text-supporting">
              <input type="checkbox" value={value} {...register('fulfilmentDetails.methods')} />
              {label}
            </label>
          ))}
        </fieldset>

        <label className="grid gap-1.5 text-form-label font-medium">
          Dispatch time
          <select
            {...register('fulfilmentDetails.dispatchTime')}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-body"
          >
            <option value="same_day">Same day</option>
            <option value="one_to_three_days">1–3 days</option>
            <option value="four_to_seven_days">4–7 days</option>
            <option value="over_seven_days">Over 7 days</option>
          </select>
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-form-label font-medium">Service regions</legend>
          {[
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
          ].map((region) => (
            <label key={region} className="flex min-h-10 items-center gap-2 text-supporting">
              <input
                type="checkbox"
                value={region}
                {...register('fulfilmentDetails.serviceRegions')}
              />
              {region}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-section-heading font-semibold">Supporting documents</h2>
        <p className="text-supporting text-text-secondary">
          Optional. PDF, JPEG, or PNG; maximum five files, 5 MB each.
        </p>

        {rejectedApplication?.applicationData.supportingDocuments.length ? (
          <p className="text-supporting text-text-secondary">
            Existing documents will be carried forward unless you attach new files.
          </p>
        ) : null}

        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(event) => {
            addFiles(event.currentTarget.files)
            event.currentTarget.value = ''
          }}
          className="block w-full text-supporting"
        />

        {documents.map(({ file, documentType }, index) => (
          <div key={`${file.name}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <span className="self-center break-all text-supporting">{file.name}</span>
            <select
              aria-label={`Document type for ${file.name}`}
              value={documentType}
              onChange={(event) =>
                setDocumentType(index, event.target.value as SellerApplicationDocumentType)
              }
              className="min-h-11 rounded-md border border-border bg-surface px-3"
            >
              <option value="business_registration">Business registration</option>
              <option value="brand_authorization">Brand authorization</option>
              <option value="other">Other</option>
            </select>
            <Button
              variant="outline"
              size="small"
              onClick={() =>
                setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </section>

      <section className="grid gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-section-heading font-semibold">Declarations</h2>
        <label className="flex items-start gap-3 text-supporting">
          <input type="checkbox" {...register('declarations.informationIsAccurate')} />
          The information I provided is accurate.
        </label>
        <label className="flex items-start gap-3 text-supporting">
          <input type="checkbox" {...register('declarations.sellerPolicyAccepted')} />I accept the
          seller policies.
        </label>
        <label className="flex items-start gap-3 text-supporting">
          <input
            type="checkbox"
            {...register('declarations.productsAreGenuineAndLegallySellable')}
          />
          My products are genuine and legally sellable.
        </label>
      </section>

      {uploadProgress !== null && (
        <p role="status" className="text-supporting text-text-secondary">
          Uploading documents: {uploadProgress}%
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy
            ? 'Submitting…'
            : rejectedApplication
              ? 'Resubmit application'
              : 'Submit application'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
