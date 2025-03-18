export const ContactStatus = ({
  isSubmitted = false,
  error = "",
  isSubmitting = false
}: {
  isSubmitted?: boolean
  error?: string
  isSubmitting?: boolean
}) => {
  if (!isSubmitted && !error && !isSubmitting) return null

  return (
    <div className="flex items-center gap-2">
      {isSubmitting && (
        <p className="text-mobile-h3 text-[#E6E6E6] xl:text-h4">
          Submitting...
        </p>
      )}

      {isSubmitted && !isSubmitting && (
        <>
          <p className="text-mobile-h3 text-[#00FF9B] xl:text-h4">
            Form submitted
          </p>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_5476_57669)">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 20.0005H0V0.000488281L20 0.00049918V20.0005ZM14.7696 7.89509L15.4767 7.18799L14.0625 5.77377L13.3554 6.48088L8.125 11.7113L6.64461 10.2309L5.93751 9.52378L4.52329 10.938L5.23039 11.6451L7.41789 13.8326C7.60543 14.0202 7.85978 14.1255 8.125 14.1255C8.39022 14.1255 8.64457 14.0202 8.83211 13.8326L14.7696 7.89509Z"
                fill="#00FF9B"
              />
            </g>
            <defs>
              <clipPath id="clip0_5476_57669">
                <rect
                  width="20"
                  height="20"
                  fill="white"
                  transform="translate(0 0.000488281)"
                />
              </clipPath>
            </defs>
          </svg>
        </>
      )}

      {error && !isSubmitting && (
        <>
          <p className="text-mobile-h3 text-[#F32D2D] xl:text-h4">{error}</p>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_5476_58668)">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.85786 0.000427246H14.1421L20 5.85829V14.1426L14.1421 20.0004H5.85786L0 14.1426V5.85829L5.85786 0.000427246ZM11 4.62543V5.62543V10.0004V11.0004H9V10.0004V5.62543V4.62543H11ZM10 15.0004C10.6904 15.0004 11.25 14.4408 11.25 13.7504C11.25 13.0601 10.6904 12.5004 10 12.5004C9.30964 12.5004 8.75 13.0601 8.75 13.7504C8.75 14.4408 9.30964 15.0004 10 15.0004Z"
                fill="#F32D2D"
              />
            </g>
            <defs>
              <clipPath id="clip0_5476_58668">
                <rect
                  width="20"
                  height="20"
                  fill="white"
                  transform="translate(0 0.000427246)"
                />
              </clipPath>
            </defs>
          </svg>
        </>
      )}
    </div>
  )
}
