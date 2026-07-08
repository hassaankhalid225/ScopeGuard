/** Marketing panel shown beside the login & register forms. */
export function AuthAside() {
  return (
    <div className="relative hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
      <div />
      <div>
        <p className="font-display text-3xl font-semibold leading-snug">
          “ScopeGuard caught $1,170 of out-of-scope work in my first week.”
        </p>
        <p className="mt-4 text-white/60">— the freelancer ScopeGuard was built for</p>
      </div>
      <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center">
        <div>
          <p className="font-display text-2xl font-semibold text-jade-300">52%</p>
          <p className="text-xs text-white/50">scope creep rate</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-jade-300">$15.6K</p>
          <p className="text-xs text-white/50">lost / year</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-jade-300">5 min</p>
          <p className="text-xs text-white/50">to protected</p>
        </div>
      </div>
    </div>
  );
}
