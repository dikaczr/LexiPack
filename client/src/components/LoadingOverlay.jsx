function  LoadingOverlay({current, total}) {

  return (
    <div className="loading-overlay">

      <div className="loading-box">

        <div className="loading-spinner"></div>

        <div className="loading-title">
          Generating AI
        </div>

        <div className="loading-subtitle">
          Please wait...
        </div>

        {
          total > 0 && (
            <>
              <div className="loading-progress">
                {current} / {total} completed
              </div>

              <div className="loading-progress-bar">

                <div
                  className="loading-progress-fill"
                  style={{
                    width: `${
                      total > 0
                        ? (current / total) * 100
                        : 0
                    }%`
                  }}
                />

              </div>
            </>
          )
        }

      </div>

    </div>
  );
}

export default LoadingOverlay;