# Dependency Notes

Where possible, dependencies are frequently updated to their latest versions.
In some cases, however, this is not feasible or does not provide sufficient
return on the necessary investment to do a major version upgrade. The following
dependencies are currently fixed to older versions:

- **react-redux**, **redux**, and **redux-thunk**: Consider migration to modern redux toolkit
- **axios**: Axios is currently tracking the latest version, but it requires the `transformIgnorePatterns` in the Jest configuration in `package.json`. This should be monitored to see if Axios, Jest, or react-scripts update to support this natively. If so, the full `"jest"` property in `package.json` can be removed safely.
- **tocbot**: Tocbot is currently fixed to `v4.17.3` (or other patch versions) in order to avoid multiple errors logged to the console. In this version, and all previous versions, there is only one error logged when navigating away from the Documentation page.
  These errors increased after version `v4.17.3`.
  [This commit](https://github.com/tscanlin/tocbot/commit/be66ad95284ebd21299a203d5479e12d85e34d62) may be related to new errors.
  Eventually, it will be good upgrade this package, but it may require reaching out for input on Github.
- **eslint**: ESLint v9 was released recently. However, eslint-config-airbnb still requires ESLint v8. Based on [this issue](https://github.com/airbnb/javascript/issues/2961), they are working on updating to support v9. Hopefully, it will be supported soon, and when it is, we can update to the latest ESLint.
- **Material UI stack**: @mui/styles is deprecated and it is not recommended to use with new versions of material. Upgrading this stack will require substantial refactoring to replace JSS with Emotion.

## Notes about overrides

- **nth-check**: nth-check is updated to the latest major version in the overrides list because `react-scripts` has dependencies that require a version with a vulnerability.
  If/When react-scripts updates to address the vulnerability, this override can be safely removed.
- **postcss**: postcss is fixed to the latest version while other packages still require older version.

## August 2025 Upgrades

| Dependency             | Current Version  | Prior Version | Notes                                                                                                                                                                                      |
| ---------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React                  | 18.3.1           | 17.0.2        | [React 18 Upgrade Guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide) - Concurrent features, automatic batching, new APIs                                                     |
| React DOM              | 18.3.1           | 17.0.2        | [Replaced Render with Create Root](https://react.dev/blog/2022/03/08/react-18-upgrade-guide#updates-to-client-rendering-apis)                                                              |
| React Router DOM       | 6.22.0           | 5.3.4         | [React Router v6 Upgrade Guide](https://reactrouter.com/en/main/upgrading/v5) - useNavigate replaces useHistory, Routes replaces Switch, element replaces component                        |
| React Redux Stack      |                  |               | To assess                                                                                                                                                                                  |
| React Tabs             | 6.1.0            | 4.3.0         | [React Tabs v6 Breaking Changes](https://github.com/reactjs/react-tabs/blob/master/CHANGELOG.md) - New API, requires React 18                                                              |
| React Helmet           | Removed          | 6.1.0         | Replaced with React Helmet Async with better support for React 18 concurrent features                                                                                                      |
| React Helmet Async     | 2.0.5            | New           | Replaced with React Helmet Async with better support for React 18 concurrent features                                                                                                      |
| @testing-library/react | 15.0.6           | 12.1.5        | [Testing Library v13+ Breaking Changes](https://github.com/testing-library/react-testing-library/blob/main/CHANGELOG.md) - Requires React 18, new render API                               |
| React Side Effects     | Removed override |               | React helmet required an older version that caused a conflicting peer dependency error. Removed override with react helmet migration                                                       |
| Express                | 5.1.0            | 4.19.2        |                                                                                                                                                                                            |
| Material UI stack      |                  |               | To assess: @mui/styles is deprecated and it is not recommended to use with new versions of material. Upgrading this stack will require substantial refactoring to replace JSS with Emotion |
| React Query            | Replaced         | 3.39.3        | Migrated to Tanstack React Query                                                                                                                                                           |
| Tanstack React Query   | 5.85.3           | New           | Migrated from react query 3; Updated useQuery and useMutation syntax                                                                                                                       |
