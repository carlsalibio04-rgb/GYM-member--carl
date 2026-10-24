import { Link } from "react-router-dom";

export default function Landing() {
    return (
        <div className="landing-page">
            <nav className="navbar navbar-expand-lg navbar-dark py-3">
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                        <img
                         src="/pwa-192x192.png"
                         alt="Momentum Gym Logo"
                        height="50"
                        />
                        <span className="landing-logo">
                            <strong>MOMENTUM</strong>
                            <small>GYM MEMBERSHIP</small>
                        </span>
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#landingNav"
                        aria-controls="landingNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="landingNav">
                        <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
                            <a className="nav-link" href="#features">Features</a>
                            <a className="nav-link" href="#plans">Membership</a>
                            <Link className="btn btn-link text-light text-decoration-none" to="/login">
                                Login
                            </Link>
                            <Link className="btn btn-danger px-4" to="/signup">
                                Join Now
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                <section className="container py-5 landing-hero">
                    <div className="row align-items-center g-5 py-lg-5">
                        <div className="col-lg-6">
                            <span className="badge text-bg-danger mb-3 px-3 py-2">
                                TRAIN WITH PURPOSE
                            </span>

                            <h1 className="display-2 fw-bold text-white mb-4">
                                Build your <span className="text-danger">momentum.</span>
                            </h1>

                            <p className="lead text-secondary mb-4">
                                Manage your gym membership, payments, and membership status
                                in one simple system.
                            </p>

                            <div className="d-flex flex-wrap gap-3 mb-5">
                                <Link className="btn btn-danger btn-lg px-4" to="/signup">
                                    Get Started ↗
                                </Link>
                                <Link className="btn btn-outline-light btn-lg px-4" to="/login">
                                    Member Login
                                </Link>
                            </div>

                            <div className="row g-3">
                                <div className="col-4">
                                    <div className="border-start border-danger border-3 ps-3">
                                        <strong className="text-white d-block">01</strong>
                                        <small className="text-secondary">Choose a plan</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="border-start border-danger border-3 ps-3">
                                        <strong className="text-white d-block">02</strong>
                                        <small className="text-secondary">Submit payment</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="border-start border-danger border-3 ps-3">
                                        <strong className="text-white d-block">03</strong>
                                        <small className="text-secondary">Get approved</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="card border-0 shadow-lg landing-membership-card">
                                <div className="card-body p-4 p-lg-5">
                                    <div className="d-flex justify-content-between mb-4">
                                        <span className="text-secondary small">MEMBERSHIP</span>
                                        <span className="badge text-bg-success">● ACTIVE</span>
                                    </div>
                                    <div className="display-1 fw-bold text-white">30</div>
                                    <p className="text-secondary">DAYS OF MOMENTUM</p>
                                    <hr className="border-secondary" />
                                    <div className="d-flex justify-content-between align-items-end">
                                        <span className="text-secondary">MONTHLY PLAN</span>
                                        <strong className="fs-2 text-danger">₱500</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="container py-5">
                    <div className="text-center mx-auto landing-section-intro">
                        <span className="text-danger fw-bold small">WHY MOMENTUM</span>
                        <h2 className="display-6 fw-bold text-white mt-2">Everything stays in motion.</h2>
                        <p className="text-secondary">
                            A straightforward system for members and gym administrators.
                        </p>
                    </div>

                    <div className="row g-4 mt-3">
                        {[
                            ["01", "Flexible Membership", "Choose weekly, monthly, or yearly membership plans."],
                            ["02", "Easy Payments", "Submit a payment and track its approval status."],
                            ["03", "Clear Status", "See your membership dates and payment history."],
                        ].map(([number, title, description]) => (
                            <div className="col-md-4" key={number}>
                                <div className="card h-100 bg-dark border-secondary shadow-sm">
                                    <div className="card-body p-4">
                                        <span className="text-danger fw-bold">{number}</span>
                                        <h3 className="h5 text-white mt-3">{title}</h3>
                                        <p className="text-secondary mb-0">{description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="plans" className="container py-5">
                    <div className="card bg-dark border-secondary shadow-sm">
                        <div className="card-body p-4 p-lg-5">
                            <div className="row align-items-center g-4">
                                <div className="col-lg-4">
                                    <span className="text-danger fw-bold small">MEMBERSHIP</span>
                                    <h2 className="text-white fw-bold mt-2">Choose your pace.</h2>
                                    <p className="text-secondary mb-0">Pick a plan that matches your routine.</p>
                                </div>
                                <div className="col-lg-8">
                                    <div className="row g-3">
                                        {[
                                            ["Weekly", "₱150", "7 Days"],
                                            ["Monthly", "₱500", "30 Days"],
                                            ["Yearly", "₱5,000", "365 Days"],
                                        ].map(([name, price, duration]) => (
                                            <div className="col-md-4" key={name}>
                                                <div className="border border-secondary rounded-3 p-3 text-center h-100">
                                                    <small className="text-secondary">{name.toUpperCase()}</small>
                                                    <div className="fs-3 fw-bold text-white my-2">{price}</div>
                                                    <small className="text-secondary">{duration}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-top border-secondary mt-5 py-4">
                <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <strong className="text-white">MOMENTUM</strong>
                        <span className="text-secondary ms-2">Gym Membership System</span>
                    </div>
                    <Link className="btn btn-outline-danger" to="/signup">
                        Start your membership →
                    </Link>
                </div>
            </footer>
        </div>
    );
}
